import json
import logging
from collections.abc import AsyncGenerator
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LlmChunk:
    """One token (or partial token) from the Ollama streaming API."""
    token: str
    model: str
    done: bool


class OllamaClient:
    # Timeout used for non-streaming housekeeping requests (e.g. health checks).
    _HOUSEKEEPING_TIMEOUT = httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)

    # Timeout for streaming LLM generation.
    # read=300: per-chunk read timeout of 5 minutes. This is a per-token timeout, not
    # a total generation timeout, so long responses are fine. It prevents the worker
    # from hanging forever if Ollama stalls mid-generation (e.g. Metal memory pressure,
    # KV-cache eviction hang, or GPU driver deadlock on Apple Silicon).
    _STREAM_TIMEOUT = httpx.Timeout(connect=10.0, read=300.0, write=30.0, pool=10.0)

    def __init__(self) -> None:
        self._http = httpx.AsyncClient(
            base_url=settings.ollama_base_url,
            # Default timeout is overridden per-request below; this is just a safety net.
            timeout=self._HOUSEKEEPING_TIMEOUT,
            trust_env=False,  # ignore HTTP_PROXY / HTTPS_PROXY env vars
        )

    async def chat_stream(
        self,
        model: str,
        messages: list[dict[str, str]],
        correlation_id: str,
        options: dict | None = None,
    ) -> AsyncGenerator[LlmChunk, None]:
        """
        Stream token-level responses from Ollama.

        Yields :class:`LlmChunk` for each line of the NDJSON response.
        The final chunk has ``done=True``; its ``token`` may be empty.
        Caller is responsible for sentence-level buffering.

        Uses ``read=None`` so slow model warm-up or long-running generations
        do not trigger a ``ReadTimeout`` mid-stream.

        ``options`` is forwarded verbatim to Ollama's ``options`` field (temperature,
        num_predict, top_p, repeat_penalty, etc.). Unrecognised keys are silently
        ignored by Ollama.
        """
        payload: dict = {"model": model, "messages": messages, "stream": True}
        if options:
            payload["options"] = options

        logger.debug("Streaming Ollama model=%s correlation=%s", model, correlation_id)

        async with self._http.stream(
            "POST", "/api/chat", json=payload, timeout=self._STREAM_TIMEOUT
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    logger.warning(
                        "Unparseable Ollama stream line. correlation=%s line=%r",
                        correlation_id, line[:120],
                    )
                    continue

                token: str = data.get("message", {}).get("content", "")
                done: bool = bool(data.get("done", False))
                yield LlmChunk(token=token, model=model, done=done)

                if done:
                    break

    async def aclose(self) -> None:
        await self._http.aclose()
