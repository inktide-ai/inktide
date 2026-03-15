#!/usr/bin/env python3
"""
Extract category examples from Twitch chat dataset for semantic classification.

Uses Hugging Face lparkourer10/twitch_chat (8.9M messages).
Output: JSON file with categories and example texts for /api/v1/classify.

Usage:
    uv run python scripts/extract_twitch_categories.py
    uv run python scripts/extract_twitch_categories.py --gaming 500 --output data/categories.json
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def valid_message(msg: str, min_len: int = 5, max_len: int = 200) -> bool:
    """Filter out spam, empty, too short/long."""
    if not msg or not isinstance(msg, str):
        return False
    s = msg.strip()
    return min_len <= len(s) <= max_len and not s.startswith("!") and "http" not in s.lower()


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract Twitch chat examples for classification")
    parser.add_argument("--gaming", type=int, default=200, help="Number of gaming examples to extract")
    parser.add_argument("--output", type=str, default="data/stream_categories.json", help="Output JSON path")
    parser.add_argument("--sample", type=int, default=100_000, help="Max rows to scan from dataset")
    args = parser.parse_args()

    try:
        from datasets import load_dataset
    except ImportError:
        print("Install: uv add datasets")
        raise SystemExit(1)

    print("Loading lparkourer10/twitch_chat...")
    # Use subset to avoid loading full 8M rows
    ds = load_dataset("lparkourer10/twitch_chat", split="train")
    sample_size = min(args.sample, len(ds))
    ds = ds.select(range(sample_size))

    gaming_examples: list[str] = []
    seen: set[str] = set()

    # Twitch chat is predominantly gaming/streaming — treat all valid messages as gaming
    for row in ds:
        msg = row.get("Message") or row.get("message") or row.get("text", "")
        if not valid_message(msg):
            continue
        if msg in seen:
            continue
        seen.add(msg)
        gaming_examples.append(msg)
        if len(gaming_examples) >= args.gaming:
            break

    # Add Russian gaming examples for better RU slang recognition
    ru_gaming = [
        "качаю ранг в дотке",
        "запилил пентакилл в лоле",
        "тима скипнула дракона",
        "играю в кс на ам",
        "радик на миде",
        "ебашу радик как гений",
        "саппорт не ставит варды",
        "фармлю до лейта",
    ]
    gaming_examples = gaming_examples[: max(0, args.gaming - len(ru_gaming))] + ru_gaming

    # Handcrafted examples for other categories (Twitch dataset is mostly gaming)
    categories = {
        "gaming": gaming_examples[: args.gaming],
        "work": [
            "отправил отчёт боссу",
            "сделал презентацию",
            "дедлайн завтра",
            "код ревью прошло",
            "деплой на прод",
            "митинг в 15:00",
            "закончил таску",
        ],
        "casual": [
            "пошёл в магазин",
            "смотрю сериал",
            "готовлю ужин",
            "как дела",
            "что делаешь",
            "просто отдыхаю",
        ],
        "music": [
            "новый альбом вышел",
            "концерт был огонь",
            "под гитару пою",
            "репетиция завтра",
        ],
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)

    print(f"Saved {sum(len(v) for v in categories.values())} examples to {out_path}")
    for k, v in categories.items():
        print(f"  {k}: {len(v)} examples")


if __name__ == "__main__":
    main()
