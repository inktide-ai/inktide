import pytest

from app.llm.sentence_accumulator import ChunkingMode, iter_sentences


async def _tokens(*words: str):
    for w in words:
        yield w


class TestChatMode:
    @pytest.mark.asyncio
    async def test_chat_mode_yields_all_tokens_as_one_string(self):
        tokens = _tokens("Hello", ", ", "world", "!")
        result = [s async for s in iter_sentences(tokens, mode=ChunkingMode.CHAT)]
        assert result == ["Hello, world!"]

    @pytest.mark.asyncio
    async def test_chat_mode_empty_stream_yields_nothing(self):
        tokens = _tokens()
        result = [s async for s in iter_sentences(tokens, mode=ChunkingMode.CHAT)]
        assert result == []

    @pytest.mark.asyncio
    async def test_chat_mode_whitespace_only_yields_nothing(self):
        tokens = _tokens("   ", "\n", "  ")
        result = [s async for s in iter_sentences(tokens, mode=ChunkingMode.CHAT)]
        assert result == []

    @pytest.mark.asyncio
    async def test_chat_mode_single_token(self):
        tokens = _tokens("Hi!")
        result = [s async for s in iter_sentences(tokens, mode=ChunkingMode.CHAT)]
        assert result == ["Hi!"]


class TestChunkingModeEnum:
    def test_chat_value(self):
        assert ChunkingMode.CHAT == "chat"

    def test_narration_value(self):
        assert ChunkingMode.NARRATION == "narration"

    def test_from_string(self):
        assert ChunkingMode("chat") is ChunkingMode.CHAT
        assert ChunkingMode("narration") is ChunkingMode.NARRATION

    def test_invalid_raises(self):
        with pytest.raises(ValueError):
            ChunkingMode("invalid")
