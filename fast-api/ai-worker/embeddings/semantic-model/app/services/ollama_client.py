"""Ollama embeddings client. Use when Hugging Face is unreachable."""
import json
import urllib.request
from typing import Any

import numpy as np


class OllamaEmbeddings:
    """Ollama API client for embeddings. Drop-in for sentence-transformers."""

    def __init__(self, base_url: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def encode(
        self,
        texts: str | list[str],
        convert_to_numpy: bool = True,
        **kwargs: Any,
    ) -> np.ndarray:
        single = isinstance(texts, str)
        inputs = [texts] if single else texts
        if not inputs:
            return np.array([], dtype=np.float32)

        req = urllib.request.Request(
            f"{self.base_url}/api/embed",
            data=json.dumps({"model": self.model, "input": inputs}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode())

        embeddings = data.get("embeddings", [])
        arr = np.array(embeddings, dtype=np.float32)
        return arr[0] if single and arr.shape[0] == 1 else arr

    def encode_document(
        self,
        texts: str | list[str],
        convert_to_numpy: bool = True,
        **kwargs: Any,
    ) -> np.ndarray:
        return self.encode(texts, convert_to_numpy, **kwargs)

    def encode_query(
        self,
        texts: str | list[str],
        convert_to_numpy: bool = True,
        **kwargs: Any,
    ) -> np.ndarray:
        return self.encode(texts, convert_to_numpy, **kwargs)
