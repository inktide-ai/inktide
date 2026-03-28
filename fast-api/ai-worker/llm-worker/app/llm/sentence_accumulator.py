"""
Buffers raw LLM tokens into TTS-ready sentence chunks.

Strategy
--------
- Flush immediately at a hard char limit (avoid overlong TTS inputs).
- Flush at strong sentence boundaries (". ", "! ", "? ") regardless of length.
- Flush at weak boundaries (", ", "; ") only once the buffer is large enough
  to avoid producing tiny audio clips.
- Keep the FIRST chunk short: the first sentence that ends is emitted as-is
  even if it's only a few words — this minimises time-to-first-audio.
"""

from __future__ import annotations


class SentenceAccumulator:
    # Emit unconditionally at this length (catches run-on sentences from LLMs)
    HARD_FLUSH_CHARS: int = 180

    # Always flush after these endings (strong sentence boundary)
    STRONG_ENDS: frozenset[str] = frozenset({". ", "! ", "? ", ".\n", "!\n", "?\n"})

    # Flush after these only when buffer is long enough (avoids 2-word clips)
    WEAK_ENDS: frozenset[str] = frozenset({", ", "; ", ":\n", "\n\n"})
    WEAK_THRESHOLD: int = 80

    def __init__(self) -> None:
        self._buf: str = ""
        self._first_chunk_emitted: bool = False

    def feed(self, token: str) -> str | None:
        """
        Append *token* to the internal buffer.
        Returns a non-empty chunk string if a flush boundary was reached,
        otherwise returns None.
        """
        self._buf += token

        # Hard cap — flush regardless of punctuation
        if len(self._buf) >= self.HARD_FLUSH_CHARS:
            return self._flush()

        # Strong sentence boundary — always flush
        for end in self.STRONG_ENDS:
            if self._buf.endswith(end):
                return self._flush()

        # Weak boundary — only flush once buffer is substantial
        # (or once the first chunk has already been emitted, so subsequent
        # pauses feel natural to the listener)
        threshold = self.WEAK_THRESHOLD if not self._first_chunk_emitted else 40
        if len(self._buf) >= threshold:
            for end in self.WEAK_ENDS:
                if self._buf.endswith(end):
                    return self._flush()

        return None

    def flush(self) -> str | None:
        """Force-flush whatever remains in the buffer (call at LLM stream end)."""
        return self._flush()

    # ------------------------------------------------------------------

    def _flush(self) -> str | None:
        chunk = self._buf.strip()
        self._buf = ""
        if not chunk:
            return None
        self._first_chunk_emitted = True
        return chunk
