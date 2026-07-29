import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.api.main import api_router
from app.core.config import settings
from app.services import embeddings, fact_extraction

logger = logging.getLogger(__name__)


def _custom_operation_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}" if route.tags else route.name


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
    try:
        embeddings.warm_up_model()
        fact_extraction.warm_up_chat()
        yield
    finally:
        embeddings.shutdown()
        fact_extraction.shutdown()
        logger.info("Shutdown complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.2.0",
    description=(
        "REST API for conversation memory: fact extraction, embeddings, "
        "and classification (Qwen via Ollama)"
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    generate_unique_id_function=_custom_operation_id,
)

app.include_router(api_router, prefix=settings.API_V1_STR)
