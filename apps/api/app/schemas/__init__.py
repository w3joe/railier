from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Any, Literal


# Block schemas
class BlockPosition(BaseModel):
    x: float
    y: float


class BlockBase(BaseModel):
    id: str
    type: Literal["input", "condition", "logic", "action", "data", "llm", "output"]
    name: str
    category: str
    config: dict[str, Any] = Field(default_factory=dict)
    position: BlockPosition


class ConnectionBase(BaseModel):
    id: str
    sourceBlockId: str
    sourceHandle: str
    targetBlockId: str
    targetHandle: str
    type: Literal["sequential", "conditional", "parallel"] = "sequential"


# Guardrail schemas
class GuardrailCreate(BaseModel):
    name: str
    description: str = ""
    blocks: list[BlockBase] = Field(default_factory=list)
    connections: list[ConnectionBase] = Field(default_factory=list)


class GuardrailUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    blocks: list[BlockBase] | None = None
    connections: list[ConnectionBase] | None = None
    is_active: bool | None = None


class GuardrailResponse(BaseModel):
    id: UUID
    name: str
    description: str
    blocks: list[dict[str, Any]]
    connections: list[dict[str, Any]]
    is_active: bool
    version: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Evaluation schemas
class EvaluationRequest(BaseModel):
    message: str
    context: dict[str, Any] | None = None
    userRole: str | None = None


class BlockExecutionResult(BaseModel):
    blockId: str
    blockType: str
    result: Any
    activated: bool
    duration: int


class EvaluationResponse(BaseModel):
    guardrailId: str
    decision: Literal["allow", "block", "warn", "require_approval"]
    reason: str
    executionTrace: list[BlockExecutionResult]
    totalDuration: int


# AI schemas
class GenerateBlocksRequest(BaseModel):
    prompt: str
    existingBlocks: list[dict[str, Any]] | None = None


class GenerateBlocksResponse(BaseModel):
    blocks: list[dict[str, Any]]
    connections: list[dict[str, Any]]
    explanation: str


# Block template schema
class BlockTemplateResponse(BaseModel):
    id: str
    type: str
    name: str
    category: str
    description: str
    default_config: dict[str, Any]
    icon: str
    color: str
    
    class Config:
        from_attributes = True
