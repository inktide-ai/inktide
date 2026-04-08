"""
Turns a raw LLM token stream into TTS-ready sentence chunks.

NARRATION mode — delegates to stream2sentence for lookahead-aware splitting:
  context_size=120 gives enough runway to resolve abbreviations before committing
  to a sentence boundary.  quick_yield_first_fragment keeps time-to-first-audio low.

CHAT mode — buffers the entire LLM response and emits it as a single chunk.
  Preserves cause-and-effect coherence for short conversational replies
  (Twitch/Discord) where latency matters less than semantic integrity.
"""

from __future__ import annotations

import asyncio
import logging
import queue as sq
import threading
from enum import Enum
from typing import AsyncIterator

from stream2sentence import generate_sentences

logger = logging.getLogger(__name__)


class ChunkingMode(str, Enum):
    CHAT = "chat"
    NARRATION = "narration"


async def iter_sentences(
    token_stream: AsyncIterator[str],
    mode: ChunkingMode = ChunkingMode.NARRATION,
) -> AsyncIterator[str]:
    """
    Async generator: consumes *token_stream* and yields TTS-ready sentence strings.
    """
    if mode == ChunkingMode.CHAT:
        buf: list[str] = []
        async for token in token_stream:
            buf.append(token)
        full = "".join(buf).strip()
        if full:
            yield full
        return

    # NARRATION: bridge async token stream → sync generate_sentences (stream2sentence
    # returns a sync generator, not async) → back to async via queue.
    loop = asyncio.get_running_loop()
    # Unbounded queue: tok_q.put() must never block the event loop thread.
    # The split thread drains it continuously so it won't grow unbounded for
    # any realistic LLM response (max_predict is typically ≤ 2048 tokens).
    tok_q: sq.Queue[str | None] = sq.Queue()
    sent_q: asyncio.Queue[str | None] = asyncio.Queue()

    async def _feed_tokens() -> None:
        async for tok in token_stream:
            tok_q.put_nowait(tok)
        tok_q.put_nowait(None)

    def _split_thread() -> None:
        def _gen():
            while (tok := tok_q.get()) is not None:
                yield tok

        try:
            for s in generate_sentences(_gen(), context_size=120, minimum_sentence_length=10):
                asyncio.run_coroutine_threadsafe(sent_q.put(s.strip()), loop).result()
        except Exception:
            logger.error("sentence splitter thread crashed", exc_info=True)
        finally:
            # Always send sentinel so the consumer loop is never stuck waiting.
            asyncio.run_coroutine_threadsafe(sent_q.put(None), loop).result()

    feeder = asyncio.create_task(_feed_tokens())
    thread = threading.Thread(target=_split_thread, daemon=True)
    thread.start()

    while (sentence := await sent_q.get()) is not None:
        if sentence:
            yield sentence

    await feeder
    await asyncio.get_event_loop().run_in_executor(None, thread.join)
