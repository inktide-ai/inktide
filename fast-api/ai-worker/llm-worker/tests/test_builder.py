from datetime import datetime

from app.models.envelope import (
    ChatMessage,
    ContextShardPayload,
    MemoryRecord,
    RagContext,
    SynapseAggregatedEnvelope,
    UserMetadata,
)
from app.prompt.builder import build_messages


def _make_sender() -> UserMetadata:
    return UserMetadata(userId="u1", userName="TestUser")


def _make_message(text: str = "hello") -> ChatMessage:
    return ChatMessage(
        platformId="twitch",
        channelId="ch1",
        channelName="TestChannel",
        sender=_make_sender(),
        text=text,
        timestamp=datetime.utcnow(),
    )


def _make_envelope(
    context: ContextShardPayload | None = None,
    rag: RagContext | None = None,
    text: str = "hello",
) -> SynapseAggregatedEnvelope:
    return SynapseAggregatedEnvelope(
        transportMessageId="msg-1",
        correlationId="corr-1",
        aggregatedAtUtc=datetime.utcnow(),
        message=_make_message(text),
        rag=rag,
        context=context,
    )


def _make_context(**kwargs) -> ContextShardPayload:
    defaults = dict(
        aiCardId="card-1",
        channelId="ch1",
        channelName="TestChannel",
        systemPrompt="You are a helpful AI.",
        personality="",
        llmProviderId="ollama",
        llmModel="llama3",
        memoryEnabled=False,
        maxMemories=5,
        inboundTextPreview="hello",
    )
    defaults.update(kwargs)
    return ContextShardPayload(**defaults)


class TestBuildMessages:
    def test_null_context_produces_fallback_system_message(self):
        envelope = _make_envelope(context=None)
        messages = build_messages(envelope)

        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert "helpful" in messages[0]["content"].lower()
        assert messages[1]["role"] == "user"

    def test_user_message_contains_sender_and_text(self):
        envelope = _make_envelope(context=None, text="what is love?")
        messages = build_messages(envelope)

        user_content = messages[1]["content"]
        assert "TestUser" in user_content
        assert "what is love?" in user_content

    def test_language_ru_injects_critical_instruction(self):
        ctx = _make_context(language="ru")
        envelope = _make_envelope(context=ctx)
        messages = build_messages(envelope)

        system_content = messages[0]["content"]
        assert "CRITICAL INSTRUCTION" in system_content
        assert "Russian" in system_content

    def test_language_unknown_code_uses_raw_code(self):
        ctx = _make_context(language="xx")
        envelope = _make_envelope(context=ctx)
        messages = build_messages(envelope)

        assert "xx" in messages[0]["content"]

    def test_memories_appear_in_system_prompt(self):
        ctx = _make_context()
        rag = RagContext(memories=[
            MemoryRecord(text="User likes cats", score=0.9),
            MemoryRecord(text="User dislikes spiders", score=0.8),
        ])
        envelope = _make_envelope(context=ctx, rag=rag)
        messages = build_messages(envelope)

        system_content = messages[0]["content"]
        assert "User likes cats" in system_content
        assert "User dislikes spiders" in system_content

    def test_no_memories_no_memory_section(self):
        ctx = _make_context()
        envelope = _make_envelope(context=ctx, rag=None)
        messages = build_messages(envelope)

        assert "memory" not in messages[0]["content"].lower()

    def test_system_prompt_always_included(self):
        ctx = _make_context(systemPrompt="You are a pirate. Say arrr.")
        envelope = _make_envelope(context=ctx)
        messages = build_messages(envelope)

        assert "You are a pirate." in messages[0]["content"]
