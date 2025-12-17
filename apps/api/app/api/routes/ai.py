import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.core.config import get_settings
from app.schemas import GenerateBlocksRequest, GenerateBlocksResponse

router = APIRouter(prefix="/ai", tags=["ai"])

settings = get_settings()


BLOCK_GENERATION_PROMPT = """You are an AI assistant creating visual guardrail flows for an LLM safety system.

CRITICAL RULES:
1. EVERY block MUST be connected - no orphaned blocks
2. Create a logical flow from input → conditions → logic gates → actions → output
3. Use proper handle names (output/true/false for sources, input/input-2 for targets)

Available block types:
- input-message: Captures incoming message (outputs: "output")
- input-context: Captures context data (outputs: "output")
- condition-contains: Keyword check (config: keywords[], matchMode: "any"|"all") (inputs: "input", outputs: "true", "false")
- condition-regex: Regex match (config: pattern) (inputs: "input", outputs: "true", "false")
- condition-role: Role check (config: allowedRoles[]) (inputs: "input", outputs: "true", "false")
- logic-and: AND gate (inputs: "input", "input-2", outputs: "output")
- logic-or: OR gate (inputs: "input", "input-2", outputs: "output")
- logic-not: NOT gate (inputs: "input", outputs: "output")
- action-block: Block request (config: message) (inputs: "input", outputs: "output")
- action-allow: Allow request (inputs: "input", outputs: "output")
- action-warn: Add warning (config: warning) (inputs: "input", outputs: "output")
- action-approval: Require approval (config: approvers[]) (inputs: "input", outputs: "output")
- action-log: Log event (config: logLevel, includeMessage) (inputs: "input", outputs: "output")
- data-user: Get user data (config: fields[]) (inputs: "input", outputs: "output")
- llm-evaluate: LLM evaluation (config: prompt, temperature) (inputs: "input", outputs: "true", "false")
- output-decision: Final output (inputs: "input")

User request: {prompt}

WORKFLOW PATTERN:
1. Start with input-message (block-1)
2. Connect to conditions/data blocks
3. Use logic gates to combine conditions if needed
4. Connect to action blocks (allow/block/warn)
5. End with output-decision

Example for "Block salary questions unless HR":
{{
  "blocks": [
    {{"templateId": "input-message", "config": {{}}}},
    {{"templateId": "condition-contains", "config": {{"keywords": ["salary", "pay"], "matchMode": "any"}}}},
    {{"templateId": "condition-role", "config": {{"allowedRoles": ["HR"]}}}},
    {{"templateId": "logic-and", "config": {{}}}},
    {{"templateId": "action-block", "config": {{"message": "Access denied"}}}},
    {{"templateId": "action-allow", "config": {{}}}},
    {{"templateId": "output-decision", "config": {{}}}}
  ],
  "connections": [
    {{"sourceBlockId": "block-1", "targetBlockId": "block-2", "sourceHandle": "output", "targetHandle": "input"}},
    {{"sourceBlockId": "block-1", "targetBlockId": "block-3", "sourceHandle": "output", "targetHandle": "input"}},
    {{"sourceBlockId": "block-2", "targetBlockId": "block-4", "sourceHandle": "true", "targetHandle": "input"}},
    {{"sourceBlockId": "block-3", "targetBlockId": "block-4", "sourceHandle": "false", "targetHandle": "input-2"}},
    {{"sourceBlockId": "block-4", "targetBlockId": "block-5", "sourceHandle": "output", "targetHandle": "input"}},
    {{"sourceBlockId": "block-3", "targetBlockId": "block-6", "sourceHandle": "true", "targetHandle": "input"}},
    {{"sourceBlockId": "block-5", "targetBlockId": "block-7", "sourceHandle": "output", "targetHandle": "input"}},
    {{"sourceBlockId": "block-6", "targetBlockId": "block-7", "sourceHandle": "output", "targetHandle": "input"}}
  ],
  "explanation": "Checks for salary keywords AND non-HR role, then blocks. HR users are allowed."
}}

Block IDs: block-1, block-2, block-3... (auto-generated in array order)

Respond ONLY with valid JSON:"""


async def call_ollama(prompt: str) -> str:
    """Call Ollama API for text generation."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0.3,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Ollama service unavailable: {str(e)}")


def validate_and_fix_connections(blocks: list, connections: list) -> tuple[list, list]:
    """Validate that all blocks are connected and fix if needed."""
    block_count = len(blocks)
    if block_count == 0:
        return blocks, connections

    # Track which blocks are connected
    connected_blocks = set()
    for conn in connections:
        # Extract block number from "block-N"
        source_num = int(conn.get("sourceBlockId", "block-0").split("-")[1])
        target_num = int(conn.get("targetBlockId", "block-0").split("-")[1])
        connected_blocks.add(source_num)
        connected_blocks.add(target_num)

    # Find orphaned blocks
    all_blocks = set(range(1, block_count + 1))
    orphaned = all_blocks - connected_blocks

    if orphaned:
        print(f"Warning: Found {len(orphaned)} orphaned blocks: {orphaned}")
        # Auto-connect orphaned blocks in sequence
        new_connections = list(connections)
        for block_num in sorted(orphaned):
            # Try to connect to previous block or next block
            if block_num > 1 and (block_num - 1) in all_blocks:
                new_connections.append({
                    "sourceBlockId": f"block-{block_num - 1}",
                    "targetBlockId": f"block-{block_num}",
                    "sourceHandle": "output",
                    "targetHandle": "input"
                })
                connected_blocks.add(block_num)
                print(f"Auto-connected: block-{block_num - 1} -> block-{block_num}")
        return blocks, new_connections

    return blocks, connections


@router.post("/generate-blocks", response_model=GenerateBlocksResponse)
async def generate_blocks(request: GenerateBlocksRequest):
    """Generate blocks from natural language description using Ollama."""
    prompt = BLOCK_GENERATION_PROMPT.format(prompt=request.prompt)

    try:
        response_text = await call_ollama(prompt)
        print(f"Ollama response: {response_text[:500]}")

        # Parse the JSON response
        import json
        result = json.loads(response_text)

        blocks = result.get("blocks", [])
        connections = result.get("connections", [])

        # Validate and fix connections
        blocks, connections = validate_and_fix_connections(blocks, connections)

        return GenerateBlocksResponse(
            blocks=blocks,
            connections=connections,
            explanation=result.get("explanation", "Generated guardrail blocks"),
        )
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Response was: {response_text[:500] if 'response_text' in locals() else 'No response'}")
        # Fallback to demo generation
        return generate_demo_blocks(request.prompt)
    except HTTPException as e:
        print(f"HTTP error: {e}")
        # Ollama not available, use demo mode
        return generate_demo_blocks(request.prompt)
    except Exception as e:
        print(f"Unexpected error: {e}")
        return generate_demo_blocks(request.prompt)


def generate_demo_blocks(prompt: str) -> GenerateBlocksResponse:
    """Generate demo blocks when Ollama is not available."""
    prompt_lower = prompt.lower()
    
    if "salary" in prompt_lower or "compensation" in prompt_lower or "pay" in prompt_lower:
        return GenerateBlocksResponse(
            blocks=[
                {"templateId": "input-message", "config": {}},
                {"templateId": "condition-contains", "config": {"keywords": ["salary", "compensation", "pay", "wage"], "matchMode": "any"}},
                {"templateId": "condition-role", "config": {"allowedRoles": ["HR", "Manager", "Admin"]}},
                {"templateId": "logic-and", "config": {}},
                {"templateId": "action-block", "config": {"message": "This information is confidential. Please contact HR directly."}},
                {"templateId": "action-allow", "config": {}},
            ],
            connections=[
                {"sourceBlockId": "block-1", "targetBlockId": "block-2", "sourceHandle": "output", "targetHandle": "input"},
                {"sourceBlockId": "block-2", "targetBlockId": "block-4", "sourceHandle": "true", "targetHandle": "input"},
                {"sourceBlockId": "block-3", "targetBlockId": "block-4", "sourceHandle": "output", "targetHandle": "input-2"},
                {"sourceBlockId": "block-4", "targetBlockId": "block-5", "sourceHandle": "output", "targetHandle": "input"},
            ],
            explanation="Generated a salary information protection guardrail that blocks salary-related queries unless the user has HR, Manager, or Admin role.",
        )
    elif "pii" in prompt_lower or "personal" in prompt_lower or "privacy" in prompt_lower:
        return GenerateBlocksResponse(
            blocks=[
                {"templateId": "input-message", "config": {}},
                {"templateId": "llm-classify", "config": {"categories": ["email", "phone", "ssn", "address"], "threshold": 0.8}},
                {"templateId": "action-block", "config": {"message": "This request contains personal information that cannot be shared."}},
                {"templateId": "action-warn", "config": {"warning": "Be careful with personal information."}},
            ],
            connections=[
                {"sourceBlockId": "block-1", "targetBlockId": "block-2", "sourceHandle": "output", "targetHandle": "input"},
            ],
            explanation="Generated a PII protection guardrail that uses AI to detect personal information in requests.",
        )
    else:
        return GenerateBlocksResponse(
            blocks=[
                {"templateId": "input-message", "config": {}},
                {"templateId": "llm-evaluate", "config": {"prompt": f"Evaluate if this request violates: {prompt}", "temperature": 0.3}},
                {"templateId": "action-allow", "config": {}},
                {"templateId": "action-block", "config": {"message": "This request has been blocked."}},
            ],
            connections=[
                {"sourceBlockId": "block-1", "targetBlockId": "block-2", "sourceHandle": "output", "targetHandle": "input"},
            ],
            explanation=f"Generated a basic AI evaluation guardrail for: {prompt}",
        )


@router.post("/import-document")
async def import_document(file: UploadFile = File(...)):
    """Import a policy document and extract rules."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    content = ""
    
    # Read file content based on type
    if file.filename.endswith(".txt"):
        content = (await file.read()).decode("utf-8")
    elif file.filename.endswith(".pdf"):
        import fitz  # PyMuPDF
        file_bytes = await file.read()
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            content = "\n".join(page.get_text() for page in doc)
    elif file.filename.endswith(".docx"):
        from docx import Document
        import io
        file_bytes = await file.read()
        doc = Document(io.BytesIO(file_bytes))
        content = "\n".join(para.text for para in doc.paragraphs)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, TXT, or DOCX.")
    
    # Use LLM to extract rules
    extraction_prompt = f"""Extract compliance rules from the following policy document and convert them into guardrail block configurations.

Document content:
{content[:4000]}

For each rule found, specify:
1. Rule name/description
2. What conditions trigger the rule
3. What action should be taken

Respond in JSON format with:
- rules: array of extracted rules with name, conditions, and actions
- summary: brief summary of the document

JSON response:"""

    try:
        response_text = await call_ollama(extraction_prompt)
        import json
        result = json.loads(response_text)
        return {
            "success": True,
            "filename": file.filename,
            "content_length": len(content),
            "rules": result.get("rules", []),
            "summary": result.get("summary", "Policy document processed"),
        }
    except Exception as e:
        # Return basic info without LLM processing
        return {
            "success": True,
            "filename": file.filename,
            "content_length": len(content),
            "rules": [],
            "summary": f"Extracted {len(content)} characters from document. LLM processing unavailable.",
        }
