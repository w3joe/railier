from fastapi import APIRouter
from app.api.routes import guardrails, evaluate, ai

router = APIRouter()

router.include_router(guardrails.router)
router.include_router(evaluate.router)
router.include_router(ai.router)
