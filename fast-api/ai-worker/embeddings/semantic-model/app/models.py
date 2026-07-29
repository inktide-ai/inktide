from typing import Annotated

from pydantic import BaseModel, Field

# Cosine similarity is mathematically bounded to [-1, 1]. Declaring the bound
# here keeps it in the OpenAPI schema and turns any regression in the scoring
# code into a loud validation error instead of a silently out-of-range score.
CosineScore = Annotated[float, Field(ge=-1.0, le=1.0)]


# Request models
class EmbedRequest(BaseModel):
    text: str


class EmbedBatchRequest(BaseModel):
    texts: list[str]


# Response models
class EmbedResponse(BaseModel):
    embedding: list[float]
    dim: int


class EmbedBatchResponse(BaseModel):
    embeddings: list[list[float]]
    dim: int


# Classification
class ClassifyRequest(BaseModel):
    text: str
    categories: dict[str, list[str]] | None = None  # If None, use default stream categories


class ClassifyResponse(BaseModel):
    category: str
    score: CosineScore
    scores: dict[str, CosineScore]  # All category scores
