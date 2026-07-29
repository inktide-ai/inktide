from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field

FactType = Literal["fact", "preference", "event", "relationship", "opinion", "skill"]

# Cosine similarity is mathematically bounded to [-1, 1]. Declaring the bound
# here keeps it in the OpenAPI schema and turns any regression in the scoring
# code into a loud validation error instead of a silently out-of-range score.
CosineScore = Annotated[float, Field(ge=-1.0, le=1.0)]




class EmbedRequest(BaseModel):
    text: str


class EmbedBatchRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    embedding: list[float]
    dim: int


class EmbedBatchResponse(BaseModel):
    embeddings: list[list[float]]
    dim: int




class ClassifyRequest(BaseModel):
    text: str
    categories: dict[str, list[str]] | None = None


class ClassifyResponse(BaseModel):
    category: str
    score: CosineScore
    scores: dict[str, CosineScore]




class UserMessage(BaseModel):
    sender: str
    text: str


class GameState(BaseModel):
    activity: str | None = None
    biome: str | None = None


class ConversationTurn(BaseModel):
    userMessage: UserMessage
    botResponse: str
    platform: str | None = None
    channelId: str | None = None
    timestamp: datetime | None = None
    gameState: GameState | None = None


class ExtractedFact(BaseModel):
    text: str
    type: FactType
    entities: list[str]
    importance: float = Field(ge=0.0, le=1.0)


class FactExtractionResponse(BaseModel):
    facts: list[ExtractedFact]
