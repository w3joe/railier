from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
from pydantic import BaseModel
import random
import time
from .llm_service import llm_service

app = FastAPI(
    title="Railier API",
    description="Visual Guardrail Builder Backend - Scratch for AI Governance",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Railier API is running",
        "version": "2.0.0",
        "description": "Scratch-like visual block builder for LLM guardrails"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# AI Block Generation Endpoints

@app.post("/blocks/generate")
async def generate_blocks(request: Dict[str, Any]):
    """
    Generate guardrail blocks from natural language

    Request body:
    {
        "prompt": "Block salary questions unless user is HR",
        "context": "Optional additional context"
    }

    Returns:
    {
        "success": true,
        "blocks": [...],
        "connections": [...],
        "confidence": 0.9,
        "suggestions": [...]
    }
    """
    try:
        prompt = request.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")

        context = request.get("context")
        result = await llm_service.generate_blocks_from_prompt(prompt, context)

        return {
            "success": True,
            "blocks": result.get("blocks", []),
            "connections": result.get("connections", []),
            "confidence": result.get("confidence", 0.8),
            "suggestions": result.get("suggestions", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate blocks: {str(e)}")

@app.post("/blocks/import-policy")
async def import_policy(file: UploadFile = File(...)):
    """
    Import policy document and extract guardrails

    Supports PDF and TXT files
    Returns multiple guardrails extracted from the document

    Returns:
    {
        "success": true,
        "guardrails": [
            {
                "name": "Rule Name",
                "description": "What it does",
                "category": "HR Policy",
                "blocks": [...],
                "connections": [...]
            }
        ],
        "source_file": "filename.pdf"
    }
    """
    try:
        # Read file content
        content = await file.read()

        # Extract text based on file type
        if file.filename.endswith('.pdf'):
            policy_text = await llm_service.extract_text_from_pdf(content)
        elif file.filename.endswith('.txt'):
            policy_text = content.decode('utf-8')
        elif file.filename.endswith('.docx'):
            # TODO: Add DOCX support
            raise HTTPException(status_code=400, detail="DOCX support coming soon. Please use PDF or TXT.")
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Please upload PDF or TXT files."
            )

        # Extract guardrails from policy text
        guardrails = await llm_service.extract_guardrails_from_policy(policy_text)

        return {
            "success": True,
            "guardrails": guardrails,
            "source_file": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import policy: {str(e)}")

# Agent Endpoints

class AgentRequest(BaseModel):
    message: str
    userRole: str

class AgentResponse(BaseModel):
    response: str
    latency_ms: int

# Mock company knowledge base
COMPANY_DATA = {
    "salary": {
        "john": "$120,000",
        "jane": "$135,000",
        "ceo": "$500,000"
    },
    "budget": {
        "marketing": "$2M",
        "engineering": "$5M"
    }
}

@app.post("/agent/finance", response_model=AgentResponse)
async def finance_agent(request: AgentRequest):
    """
    Mock Finance Company Agent.
    It answers questions about salaries and budgets if it receives them.
    Note: The guardrail should have blocked unauthorized access before this is called.
    """
    start_time = time.time()
    message = request.message.lower()
    response = "I am the Finance Agent. I can help with company financial data."

    # Simple keyword matching for mock responses
    if "salary" in message:
        if "john" in message:
            response = f"John's salary is {COMPANY_DATA['salary']['john']}."
        elif "jane" in message:
            response = f"Jane's salary is {COMPANY_DATA['salary']['jane']}."
        elif "ceo" in message:
            response = f"The CEO's salary is {COMPANY_DATA['salary']['ceo']}."
        else:
            response = "I have access to salary data for John, Jane, and the CEO."
    elif "budget" in message:
        if "marketing" in message:
            response = f"The Marketing budget is {COMPANY_DATA['budget']['marketing']}."
        elif "engineering" in message:
            response = f"The Engineering budget is {COMPANY_DATA['budget']['engineering']}."
        else:
            response = "I have budget data for Marketing and Engineering."
    else:
        # Generic LLM-like response for other queries
        responses = [
            "I can provide details on company financials.",
            "Please specify whose salary or which department's budget you need.",
            "I am authorized to discuss financial matters."
        ]
        response = random.choice(responses)

    duration = int((time.time() - start_time) * 1000)
    
    # Simulate LLM thinking time
    time.sleep(0.5)
    
    return AgentResponse(response=response, latency_ms=duration)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
