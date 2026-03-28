"""Extract memorable facts from conversation turns using Qwen via Ollama."""
from __future__ import annotations

import json
import logging
from typing import Any, get_args

from app.core.config import settings
from app.models import ConversationTurn, ExtractedFact, FactType
from app.services.ollama_client import OllamaChat

logger = logging.getLogger(__name__)

_chat_client: OllamaChat | None = None

VALID_FACT_TYPES: frozenset[str] = frozenset(get_args(FactType))

SYSTEM_PROMPT = """\
You are a fact-extraction assistant. Your job is to extract memorable, \
important facts from a single conversation turn between a chat user and a bot.

Return a JSON object {"facts": [...]} where each fact has:
- "text": a concise English summary of the fact
- "type": one of "fact", "preference", "event", "relationship", "opinion", "skill"
- "entities": list of key entity names mentioned
- "importance": float 0.0 to 1.0 (how memorable / useful this fact is long-term)

Rules:
- Only extract genuinely useful facts that would help the bot remember the user.
- Prefer quality over quantity: 1-3 facts per turn is typical.
- If there is nothing memorable, return {"facts": []}.
- Output ONLY the JSON object, no extra text.\
"""


# ── lifecycle ───────────────────────────────────────────────────────


def get_chat_client() -> OllamaChat:
    global _chat_client
    if _chat_client is None:
        _chat_client = OllamaChat(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_CHAT_MODEL,
            timeout=settings.OLLAMA_TIMEOUT,
        )
    return _chat_client


def is_chat_ready() -> bool:
    return _chat_client is not None


def warm_up_chat() -> None:
    """Send a throwaway request so Ollama loads the model into memory."""
    try:
        client = get_chat_client()
        client.generate("Respond with OK.", temperature=0.0)
        logger.info("Chat model ready (%s)", settings.OLLAMA_CHAT_MODEL)
    except Exception:
        logger.exception("Failed to warm up chat model — Ollama may be unavailable")


def shutdown() -> None:
    global _chat_client
    if _chat_client is not None:
        _chat_client.close()
        _chat_client = None


# ── prompt building ─────────────────────────────────────────────────


def build_user_prompt(turn: ConversationTurn) -> str:
    """Build the user-role prompt that is sent alongside SYSTEM_PROMPT."""
    lines = [
        "Extract memorable facts from this conversation turn.",
        "",
        "Conversation:",
        f'User ({turn.userMessage.sender}): "{turn.userMessage.text}"',
        f'Bot: "{turn.botResponse}"',
    ]

    if turn.gameState:
        parts: list[str] = []
        if turn.gameState.activity:
            parts.append(turn.gameState.activity)
        if turn.gameState.biome:
            parts.append(f"in {turn.gameState.biome} biome")
        if parts:
            lines.append("")
            lines.append(f"Game context: {', '.join(parts)}")

    if turn.platform:
        lines.append(f"Platform: {turn.platform}")

    return "\n".join(lines)


# ── LLM response parsing ───────────────────────────────────────────


def parse_facts(raw: str) -> list[dict[str, Any]]:
    """Parse LLM JSON output into a list of fact dicts.

    Tolerant to both ``{"facts": [...]}`` and bare ``[...]`` formats,
    as well as stray wrapper text around the JSON.
    """
    text = raw.strip()
    if not text:
        return []

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("["), text.rfind("]")
        if start != -1 and end > start:
            try:
                parsed = json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                logger.warning("Unparseable LLM response: %.200s", raw)
                return []
        else:
            logger.warning("No JSON found in LLM response: %.200s", raw)
            return []

    if isinstance(parsed, dict):
        parsed = parsed.get("facts", [])
    if isinstance(parsed, list):
        return parsed
    return []


def coerce_fact(item: dict[str, Any]) -> ExtractedFact | None:
    """Convert a raw dict from the LLM into an ``ExtractedFact``, or
    *None* if the dict is too malformed to salvage."""
    try:
        fact_type = str(item.get("type", "fact"))
        if fact_type not in VALID_FACT_TYPES:
            fact_type = "fact"

        importance = float(item.get("importance", 0.5))
        importance = max(0.0, min(1.0, importance))

        return ExtractedFact(
            text=str(item.get("text", "")),
            type=fact_type,  # type: ignore[arg-type]
            entities=[str(e) for e in item.get("entities", [])],
            importance=importance,
        )
    except (ValueError, TypeError) as exc:
        logger.warning("Skipping malformed fact %r: %s", item, exc)
        return None


# ── main entry point ────────────────────────────────────────────────


def extract_facts(turn: ConversationTurn) -> list[ExtractedFact]:
    client = get_chat_client()
    user_prompt = build_user_prompt(turn)

    raw = client.chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
        format="json",
    )

    return [f for f in map(coerce_fact, parse_facts(raw)) if f is not None]
