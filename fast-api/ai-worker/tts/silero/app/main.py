"""Silero TTS (Russian) behind the HTTP API of Kokoro-FastAPI, a subset of OpenAI's audio API.

The Inktide TTS module talks to it exactly like to Kokoro:
  POST /v1/audio/speech   {"input", "voice", "response_format", "speed"} -> audio bytes
  GET  /v1/audio/voices   {"voices": [...]}
  GET  /v1/models         OpenAI-style model list
"""

import io
import os
import re
import threading
import wave
from contextlib import asynccontextmanager
from xml.sax.saxutils import escape

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from .normalize import normalize

MODEL_PATH = os.getenv("SILERO_MODEL_PATH", "/app/models/v4_ru.pt")
SAMPLE_RATE = int(os.getenv("SILERO_SAMPLE_RATE", "48000"))
DEFAULT_VOICE = os.getenv("SILERO_DEFAULT_VOICE", "xenia")
VOICES = ["xenia", "kseniya", "baya", "aidar", "eugene"]
# Silero refuses very long inputs; replies are split into sentences and joined back.
MAX_CHUNK = 800

torch.set_num_threads(int(os.getenv("SILERO_THREADS", "4")))
# oneDNN builds a kernel for every new input shape, i.e. for almost every sentence: a fresh
# sentence took 0.6-3 s with it and 0.06-0.2 s without it on a 4-core VM.
torch.backends.mkldnn.enabled = False
_model = torch.package.PackageImporter(MODEL_PATH).load_pickle("tts_models", "model")
_model.to(torch.device("cpu"))
# One synthesis at a time: the model is not safe to call from several threads.
_lock = threading.Lock()


@asynccontextmanager
async def _lifespan(_: FastAPI):
    # The first call takes ~2 s; pay for it before the first viewer message does.
    _model.apply_tts(text="Привет, чат, как дела?", speaker=DEFAULT_VOICE, sample_rate=SAMPLE_RATE)
    yield


app = FastAPI(title="Inktide Silero TTS", lifespan=_lifespan)


class SpeechRequest(BaseModel):
    input: str
    voice: str | None = None
    model: str | None = None
    response_format: str | None = "wav"
    speed: float | None = 1.0


def _rate(speed: float) -> str | None:
    """Silero has no numeric speed, only SSML prosody steps."""
    if speed <= 0.75:
        return "x-slow"
    if speed <= 0.9:
        return "slow"
    if speed < 1.15:
        return None
    if speed < 1.4:
        return "fast"
    return "x-fast"


def _chunks(text: str) -> list[str]:
    if len(text) <= MAX_CHUNK:
        return [text]
    parts, current = [], ""
    for sentence in re.split(r"(?<=[.!?…])\s+", text):
        if current and len(current) + len(sentence) + 1 > MAX_CHUNK:
            parts.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        parts.append(current)
    return [p[:MAX_CHUNK] for p in parts]


def _synthesize(text: str, voice: str, speed: float) -> np.ndarray:
    rate = _rate(speed)
    pieces = []
    with _lock:
        for chunk in _chunks(text):
            if rate:
                ssml = f'<speak><prosody rate="{rate}">{escape(chunk)}</prosody></speak>'
                audio = _model.apply_tts(ssml_text=ssml, speaker=voice, sample_rate=SAMPLE_RATE)
            else:
                audio = _model.apply_tts(
                    text=chunk, speaker=voice, sample_rate=SAMPLE_RATE, put_accent=True, put_yo=True
                )
            pieces.append(audio.numpy())
    return np.concatenate(pieces)


def _pcm16(audio: np.ndarray) -> bytes:
    return (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2").tobytes()


def _wav(pcm: bytes) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm)
    return buf.getvalue()


def _mp3(pcm: bytes) -> bytes:
    import lameenc

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(128)
    encoder.set_in_sample_rate(SAMPLE_RATE)
    encoder.set_channels(1)
    encoder.set_quality(2)
    return encoder.encode(pcm) + encoder.flush()


@app.post("/v1/audio/speech")
def speech(req: SpeechRequest) -> Response:
    text = normalize(req.input)
    if not text:
        raise HTTPException(status_code=400, detail="input has nothing Silero can pronounce")

    voice = req.voice if req.voice in VOICES else DEFAULT_VOICE
    fmt = (req.response_format or "wav").lower()
    if fmt not in ("wav", "pcm", "mp3"):
        raise HTTPException(
            status_code=400, detail=f"response_format '{fmt}' is not supported (wav, pcm, mp3)"
        )

    pcm = _pcm16(_synthesize(text, voice, req.speed or 1.0))
    if fmt == "pcm":
        return Response(content=pcm, media_type="audio/pcm")
    if fmt == "mp3":
        return Response(content=_mp3(pcm), media_type="audio/mpeg")
    return Response(content=_wav(pcm), media_type="audio/wav")


@app.get("/v1/audio/voices")
def voices() -> dict:
    return {"voices": VOICES}


@app.get("/v1/models")
def models() -> dict:
    return {
        "object": "list",
        "data": [{"id": "silero-v4-ru", "object": "model", "owned_by": "silero"}],
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
