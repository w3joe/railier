import uuid
import time
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import Guardrail, EvaluationLog
from app.schemas import EvaluationRequest, EvaluationResponse, BlockExecutionResult

router = APIRouter(prefix="/guardrails", tags=["evaluation"])


def execute_block(block: dict, context: dict) -> tuple[bool, any, int]:
    """Execute a single block and return (activated, result, duration_ms)."""
    start = time.time()
    block_type = block.get("type")
    config = block.get("config", {})
    activated = False
    result = None
    
    try:
        if block_type == "input":
            # Input blocks always activate and pass through data
            activated = True
            result = context.get("message", "")
            
        elif block_type == "condition":
            template_id = block.get("templateId", "")
            message = context.get("message", "").lower()
            
            if "contains" in template_id:
                # Check if message contains keywords
                keywords = config.get("keywords", [])
                match_mode = config.get("matchMode", "any")
                
                if match_mode == "any":
                    activated = any(kw.lower() in message for kw in keywords)
                else:
                    activated = all(kw.lower() in message for kw in keywords)
                result = activated
                
            elif "role" in template_id:
                # Check user role
                allowed_roles = [r.lower() for r in config.get("allowedRoles", [])]
                user_role = context.get("userRole", "").lower()
                activated = user_role in allowed_roles
                result = activated
                
            elif "regex" in template_id:
                # Regex match
                pattern = config.get("pattern", "")
                if pattern:
                    activated = bool(re.search(pattern, context.get("message", ""), re.IGNORECASE))
                result = activated
                
        elif block_type == "logic":
            template_id = block.get("templateId", "")
            # Logic blocks combine input results
            # For now, we simulate based on context
            inputs = context.get("_block_inputs", {}).get(block.get("id"), [])
            
            if "and" in template_id:
                activated = all(inputs) if inputs else False
            elif "or" in template_id:
                activated = any(inputs) if inputs else False
            elif "not" in template_id:
                activated = not (inputs[0] if inputs else True)
            result = activated
            
        elif block_type == "action":
            template_id = block.get("templateId", "")
            activated = True  # Actions always activate when reached
            
            if "block" in template_id:
                result = {"action": "block", "message": config.get("message", "Request blocked.")}
            elif "allow" in template_id:
                result = {"action": "allow"}
            elif "warn" in template_id:
                result = {"action": "warn", "warning": config.get("warning", "")}
            elif "approval" in template_id:
                result = {"action": "require_approval", "approvers": config.get("approvers", [])}
            elif "log" in template_id:
                result = {"action": "log", "level": config.get("logLevel", "info")}
                
        elif block_type == "data":
            activated = True
            template_id = block.get("templateId", "")
            
            if "policy" in template_id:
                result = {"policyId": config.get("policyId", ""), "loaded": True}
            elif "user" in template_id:
                result = {"userRole": context.get("userRole"), "fields": config.get("fields", [])}
                
        elif block_type == "llm":
            # For now, simulate LLM response
            activated = True
            prompt = config.get("prompt", "")
            # In real implementation, this would call Ollama
            result = {"evaluated": True, "prompt": prompt}
            
        elif block_type == "output":
            activated = True
            result = context.get("_final_decision", "allow")
            
    except Exception as e:
        result = {"error": str(e)}
    
    duration = int((time.time() - start) * 1000)
    return activated, result, duration


@router.post("/{guardrail_id}/evaluate", response_model=EvaluationResponse)
async def evaluate_guardrail(
    guardrail_id: uuid.UUID,
    request: EvaluationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Evaluate an input against a guardrail."""
    start_time = time.time()
    
    # Get the guardrail
    result = await db.execute(select(Guardrail).where(Guardrail.id == guardrail_id))
    guardrail = result.scalar_one_or_none()
    if not guardrail:
        raise HTTPException(status_code=404, detail="Guardrail not found")
    
    # Build execution context
    context = {
        "message": request.message,
        "userRole": request.userRole or "",
        **(request.context or {}),
        "_block_inputs": {},
        "_final_decision": "allow",
    }
    
    # Execute blocks in order (simplified - real implementation would use topological sort)
    blocks = guardrail.blocks
    execution_trace = []
    final_decision = "allow"
    final_reason = "Request passed all guardrail checks"
    
    for block in blocks:
        activated, result_data, duration = execute_block(block, context)
        
        trace = BlockExecutionResult(
            blockId=block.get("id"),
            blockType=block.get("type"),
            result=result_data,
            activated=activated,
            duration=duration,
        )
        execution_trace.append(trace)
        
        # Check for decision actions
        if block.get("type") == "action" and activated and isinstance(result_data, dict):
            action = result_data.get("action")
            if action == "block":
                final_decision = "block"
                final_reason = result_data.get("message", "Request blocked")
                break
            elif action == "warn":
                final_decision = "warn"
                final_reason = result_data.get("warning", "Warning issued")
            elif action == "require_approval":
                final_decision = "require_approval"
                final_reason = "Request requires human approval"
    
    total_duration = int((time.time() - start_time) * 1000)
    
    # Log the evaluation
    log = EvaluationLog(
        guardrail_id=guardrail_id,
        input_data={"message": request.message, "userRole": request.userRole},
        execution_trace=[t.model_dump() for t in execution_trace],
        decision=final_decision,
        reason=final_reason,
        latency_ms=total_duration,
    )
    db.add(log)
    await db.commit()
    
    return EvaluationResponse(
        guardrailId=str(guardrail_id),
        decision=final_decision,
        reason=final_reason,
        executionTrace=execution_trace,
        totalDuration=total_duration,
    )
