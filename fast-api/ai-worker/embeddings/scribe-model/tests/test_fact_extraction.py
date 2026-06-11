"""Unit tests for fact extraction — parsing, prompt building, coercion."""
import json

import pytest

from app.models import ConversationTurn, GameState, UserMessage
from app.services.fact_extraction import (
    VALID_FACT_TYPES,
    build_user_prompt,
    coerce_fact,
    parse_facts,
)




class TestParseFacts:
    def test_bare_array(self):
        raw = json.dumps([{"text": "x", "type": "fact", "entities": [], "importance": 0.5}])
        assert len(parse_facts(raw)) == 1

    def test_object_wrapper(self):
        raw = json.dumps({"facts": [{"text": "x"}]})
        assert len(parse_facts(raw)) == 1

    def test_empty_string(self):
        assert parse_facts("") == []

    def test_invalid_json(self):
        assert parse_facts("not json at all") == []

    def test_json_with_surrounding_text(self):
        raw = 'Here are the facts: [{"text": "a"}] Hope this helps!'
        assert len(parse_facts(raw)) == 1

    def test_empty_array(self):
        assert parse_facts("[]") == []

    def test_empty_object_wrapper(self):
        assert parse_facts('{"facts": []}') == []

    def test_non_list_value(self):
        assert parse_facts('"just a string"') == []

    def test_nested_object_no_facts_key(self):
        assert parse_facts('{"result": "ok"}') == []




class TestCoerceFact:
    def test_valid_fact(self):
        f = coerce_fact({"text": "hello", "type": "preference", "entities": ["a"], "importance": 0.8})
        assert f is not None
        assert f.type == "preference"
        assert f.importance == 0.8

    def test_unknown_type_defaults_to_fact(self):
        f = coerce_fact({"text": "x", "type": "UNKNOWN", "entities": [], "importance": 0.5})
        assert f is not None
        assert f.type == "fact"

    def test_importance_clamped_high(self):
        f = coerce_fact({"text": "x", "type": "fact", "entities": [], "importance": 5.0})
        assert f is not None
        assert f.importance == 1.0

    def test_importance_clamped_low(self):
        f = coerce_fact({"text": "x", "type": "fact", "entities": [], "importance": -1.0})
        assert f is not None
        assert f.importance == 0.0

    def test_missing_fields_use_defaults(self):
        f = coerce_fact({})
        assert f is not None
        assert f.text == ""
        assert f.type == "fact"
        assert f.importance == 0.5

    def test_malformed_importance_returns_none(self):
        assert coerce_fact({"importance": "not a number"}) is None

    def test_all_valid_types_accepted(self):
        for t in VALID_FACT_TYPES:
            f = coerce_fact({"text": "x", "type": t, "entities": [], "importance": 0.5})
            assert f is not None
            assert f.type == t




class TestBuildUserPrompt:
    def _turn(self, **overrides) -> ConversationTurn:
        defaults = dict(
            userMessage=UserMessage(sender="Alice", text="hi"),
            botResponse="hello",
        )
        return ConversationTurn(**(defaults | overrides))

    def test_basic(self):
        prompt = build_user_prompt(self._turn())
        assert 'User (Alice): "hi"' in prompt
        assert 'Bot: "hello"' in prompt

    def test_with_game_state(self):
        prompt = build_user_prompt(self._turn(gameState=GameState(activity="mining", biome="caves")))
        assert "mining" in prompt
        assert "caves" in prompt

    def test_with_platform(self):
        prompt = build_user_prompt(self._turn(platform="twitch"))
        assert "Platform: twitch" in prompt

    def test_no_game_context_when_absent(self):
        prompt = build_user_prompt(self._turn())
        assert "Game context" not in prompt

    def test_partial_game_state(self):
        prompt = build_user_prompt(self._turn(gameState=GameState(activity="building")))
        assert "building" in prompt
        assert "biome" not in prompt
