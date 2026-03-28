from app.models.envelope import SynapseAggregatedEnvelope


type OllamaMessage = dict[str, str]


def build_messages(envelope: SynapseAggregatedEnvelope) -> list[OllamaMessage]:
    """Build Ollama messages array from aggregated context envelope."""
    system_content = _build_system(envelope)
    user_content = _build_user(envelope)

    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_content},
    ]


def _build_system(envelope: SynapseAggregatedEnvelope) -> str:
    ctx = envelope.context
    if ctx is None:
        return "You are a helpful AI assistant."

    parts = [ctx.system_prompt]

    if ctx.personality:
        parts.append(ctx.personality)

    memories = envelope.rag.memories if envelope.rag else []
    if memories:
        memory_lines = "\n".join(f"- {m.text}" for m in memories)
        parts.append(f"\nRelevant context from memory:\n{memory_lines}")

    return "\n\n".join(parts)


def _build_user(envelope: SynapseAggregatedEnvelope) -> str:
    msg = envelope.message
    return f"{msg.sender.user_name}: {msg.text}"
