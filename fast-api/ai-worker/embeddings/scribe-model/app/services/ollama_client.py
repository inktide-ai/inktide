"""Ollama HTTP client — embeddings and chat (Qwen).

Uses httpx for connection pooling, proper timeouts, and modern API.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx
import numpy as np

logger = logging.getLogger(__name__)


# ── Shared base ─────────────────────────────────────────────────────


class _OllamaBase:
    """HTTP transport shared by all Ollama API wrappers."""

    def __init__(self, base_url: str, model: str, timeout: int = 120) -> None:
        self.model = model
        self._client = httpx.Client(
            base_url=base_url.rstrip("/"),
            timeout=httpx.Timeout(timeout, connect=10),
        )

    def _post(self, path: str, payload: dict) -> dict:
        resp = self._client.post(path, json=payload)
        resp.raise_for_status()
        return resp.json()

    def close(self) -> None:
        self._client.close()


# ── Embeddings ──────────────────────────────────────────────────────


class OllamaEmbeddings(_OllamaBase):
    """Ollama ``/api/embed`` wrapper.  Returns numpy arrays."""

    def encode(self, texts: str | list[str], **_: Any) -> np.ndarray:
        single = isinstance(texts, str)
        inputs = [texts] if single else texts
        if not inputs:
            return np.array([], dtype=np.float32)

        data = self._post("/api/embed", {"model": self.model, "input": inputs})
        arr = np.array(data.get("embeddings", []), dtype=np.float32)
        return arr[0] if single and arr.shape[0] == 1 else arr


# ── Chat / Generate ─────────────────────────────────────────────────


class OllamaChat(_OllamaBase):
    """Ollama ``/api/chat`` and ``/api/generate`` wrapper for LLM inference."""

    def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.1,
        format: str | None = "json",
    ) -> str:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if format:
            payload["format"] = format
        data = self._post("/api/chat", payload)
        return data.get("message", {}).get("content", "")

    def generate(
        self,
        prompt: str,
        *,
        system: str | None = None,
        temperature: float = 0.1,
    ) -> str:
        payload: dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if system:
            payload["system"] = system
        data = self._post("/api/generate", payload)
        return data.get("response", "")

    def ping(self) -> bool:
        """Return *True* if Ollama is reachable and the model is loaded."""
        try:
            resp = self._client.get("/api/tags")
            resp.raise_for_status()
            models = [m.get("name", "") for m in resp.json().get("models", [])]
            return any(self.model in m for m in models)
        except Exception:
            return False
