"""Fact extraction from conversation turns via Qwen LLM."""
import asyncio

from fastapi import APIRouter, HTTPException

from app.models import ConversationTurn, FactExtractionResponse
from app.services.fact_extraction import extract_facts

router = APIRouter()


@router.post("", response_model=FactExtractionResponse)
@router.post("/", response_model=FactExtractionResponse)
async def extract(turn: ConversationTurn):
    if not turn.userMessage.text.strip():
        raise HTTPException(status_code=400, detail="User message text cannot be empty")
    if not turn.botResponse.strip():
        raise HTTPException(status_code=400, detail="Bot response cannot be empty")

    facts = await asyncio.to_thread(extract_facts, turn)
    return FactExtractionResponse(facts=facts)
