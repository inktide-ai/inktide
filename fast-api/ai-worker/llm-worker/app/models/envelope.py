from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class UserMetadata(_CamelModel):
    user_id: str
    user_name: str
    badges: list[str] = []
    is_moderator: bool = False
    is_subscriber: bool = False
    is_vip: bool = False
    is_broadcaster: bool = False
    color: str | None = None


class ChatMessage(_CamelModel):
    platform_id: str
    channel_id: str
    channel_name: str
    sender: UserMetadata
    text: str
    timestamp: datetime


class MemoryRecord(_CamelModel):
    text: str
    score: float = 0.0
    metadata: dict[str, Any] = {}


class RagContext(_CamelModel):
    memories: list[MemoryRecord] = []


class ContextShardPayload(_CamelModel):
    ai_card_id: str
    channel_id: str
    channel_name: str
    system_prompt: str
    personality: str
    llm_provider_id: str
    llm_model: str
    memory_enabled: bool
    max_memories: int
    inbound_text_preview: str
    # TTS fields resolved by ChannelContextResolutionService from TtsCatalogEntry.
    # Forwarded to synapse.llm.response so the .NET TTS worker can synthesize
    # without an extra DB round-trip.
    tts_provider_id: str | None = None
    tts_voice_id: str | None = None
    tts_model_id: str | None = None
    tts_speed: float = 1.0


class SynapseAggregatedEnvelope(_CamelModel):
    transport_message_id: str
    correlation_id: str
    aggregated_at_utc: datetime
    message: ChatMessage
    rag: RagContext | None = None
    context: ContextShardPayload | None = None
