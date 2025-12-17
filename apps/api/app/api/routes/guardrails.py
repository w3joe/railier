import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import Guardrail
from app.schemas import (
    GuardrailCreate,
    GuardrailUpdate,
    GuardrailResponse,
)

router = APIRouter(prefix="/guardrails", tags=["guardrails"])


@router.get("", response_model=list[GuardrailResponse])
async def list_guardrails(db: AsyncSession = Depends(get_db)):
    """List all guardrails."""
    result = await db.execute(select(Guardrail).order_by(Guardrail.updated_at.desc()))
    guardrails = result.scalars().all()
    return guardrails


@router.get("/{guardrail_id}", response_model=GuardrailResponse)
async def get_guardrail(guardrail_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific guardrail by ID."""
    result = await db.execute(select(Guardrail).where(Guardrail.id == guardrail_id))
    guardrail = result.scalar_one_or_none()
    if not guardrail:
        raise HTTPException(status_code=404, detail="Guardrail not found")
    return guardrail


@router.post("", response_model=GuardrailResponse)
async def create_guardrail(data: GuardrailCreate, db: AsyncSession = Depends(get_db)):
    """Create a new guardrail."""
    guardrail = Guardrail(
        name=data.name,
        description=data.description,
        blocks=[block.model_dump() for block in data.blocks],
        connections=[conn.model_dump() for conn in data.connections],
    )
    db.add(guardrail)
    await db.commit()
    await db.refresh(guardrail)
    return guardrail


@router.put("/{guardrail_id}", response_model=GuardrailResponse)
async def update_guardrail(
    guardrail_id: uuid.UUID, data: GuardrailUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an existing guardrail."""
    result = await db.execute(select(Guardrail).where(Guardrail.id == guardrail_id))
    guardrail = result.scalar_one_or_none()
    if not guardrail:
        raise HTTPException(status_code=404, detail="Guardrail not found")
    
    if data.name is not None:
        guardrail.name = data.name
    if data.description is not None:
        guardrail.description = data.description
    if data.blocks is not None:
        guardrail.blocks = [block.model_dump() for block in data.blocks]
    if data.connections is not None:
        guardrail.connections = [conn.model_dump() for conn in data.connections]
    if data.is_active is not None:
        guardrail.is_active = data.is_active
    
    guardrail.version += 1
    await db.commit()
    await db.refresh(guardrail)
    return guardrail


@router.delete("/{guardrail_id}")
async def delete_guardrail(guardrail_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a guardrail."""
    result = await db.execute(select(Guardrail).where(Guardrail.id == guardrail_id))
    guardrail = result.scalar_one_or_none()
    if not guardrail:
        raise HTTPException(status_code=404, detail="Guardrail not found")
    
    await db.delete(guardrail)
    await db.commit()
    return {"success": True}
