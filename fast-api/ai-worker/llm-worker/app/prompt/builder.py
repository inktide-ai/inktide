from app.models.envelope import SynapseAggregatedEnvelope

OllamaMessage = dict[str, str]


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

    _LANGUAGE_NAMES = {
        "ru": "Russian", "en": "English", "de": "German",
        "fr": "French", "es": "Spanish", "ja": "Japanese",
        "zh": "Chinese", "uk": "Ukrainian",
    }

    parts = []

    if ctx.language:
        lang_name = _LANGUAGE_NAMES.get(ctx.language, ctx.language)
        parts.append(
            f"CRITICAL INSTRUCTION: You MUST respond exclusively in {lang_name}. "
            f"This rule overrides everything else in this prompt, including the "
            f"character's voice, style, and any language used in the system prompt. "
            f"Never switch to another language under any circumstances."
        )

    parts.append(ctx.system_prompt)

    memories = envelope.rag.memories if envelope.rag else []
    if memories:
        memory_lines = "\n".join(f"- {m.text}" for m in memories)
        parts.append(f"Relevant context from memory:\n{memory_lines}")

    if ctx.personality:
        parts.append(ctx.personality)

    return "\n\n".join(parts)


def _build_user(envelope: SynapseAggregatedEnvelope) -> str:
    msg = envelope.message
    return f"{msg.sender.user_name}: {msg.text}"
