from pydantic import BaseModel


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
    score: float
    scores: dict[str, float]  # All category scores
