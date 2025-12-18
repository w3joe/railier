from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import time

router = APIRouter(prefix="/agent", tags=["agent"])

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

@router.post("/finance", response_model=AgentResponse)
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
