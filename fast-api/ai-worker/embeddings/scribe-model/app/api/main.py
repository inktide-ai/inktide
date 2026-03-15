from fastapi import APIRouter

from app.api.routes import classify, embeddings, facts, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(facts.router, prefix="/extract-facts", tags=["facts"])
api_router.include_router(embeddings.router, prefix="/embed", tags=["embeddings"])
api_router.include_router(classify.router, prefix="/classify", tags=["classify"])
