import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class Guardrail(Base):
    __tablename__ = "guardrails"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    blocks: Mapped[dict] = mapped_column(JSONB, default=list)
    connections: Mapped[dict] = mapped_column(JSONB, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    evaluations: Mapped[list["EvaluationLog"]] = relationship(
        "EvaluationLog", back_populates="guardrail", cascade="all, delete-orphan"
    )


class EvaluationLog(Base):
    __tablename__ = "evaluation_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    guardrail_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("guardrails.id"), nullable=False
    )
    input_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    execution_trace: Mapped[dict] = mapped_column(JSONB, default=list)
    decision: Mapped[str] = mapped_column(String(50), nullable=False)
    reason: Mapped[str] = mapped_column(Text, default="")
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    
    # Relationships
    guardrail: Mapped["Guardrail"] = relationship("Guardrail", back_populates="evaluations")


class BlockTemplate(Base):
    __tablename__ = "block_templates"
    
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    default_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    icon: Mapped[str] = mapped_column(String(50), default="Box")
    color: Mapped[str] = mapped_column(String(20), default="#6366f1")
