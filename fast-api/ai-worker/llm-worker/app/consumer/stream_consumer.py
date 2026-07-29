import asyncio
import json
import logging

import httpx
import redis.asyncio as aioredis
from pydantic import ValidationError

from app.core.config import settings
from app.llm.client import OllamaClient
from app.llm.sentence_accumulator import ChunkingMode, iter_sentences
from app.models.envelope import SynapseAggregatedEnvelope
from app.prompt.builder import build_messages

logger = logging.getLogger(__name__)

_FALLBACK_MODEL = settings.ollama_fallback_model
_PAYLOAD_FIELD = b"payload"


class StreamConsumer:
    def __init__(self, redis: aioredis.Redis, llm: OllamaClient) -> None:
        self._redis = redis
        self._llm = llm
        # Ollama serialises requests internally — running two concurrent generations
        # doubles the wait time for both. A single semaphore keeps throughput honest:
        # one active generation at a time, queue the rest.
        self._llm_sem = asyncio.Semaphore(1)

    async def run(self) -> None:
        await self._ensure_consumer_group()
        logger.info(
            "LLM worker started. stream=%s group=%s consumer=%s",
            settings.redis_stream_in,
            settings.redis_consumer_group,
            settings.redis_consumer_name,
        )
        tasks = [
            asyncio.create_task(self._consume_loop()),
            asyncio.create_task(self._autoclaim_loop()),
        ]
        try:
            await asyncio.gather(*tasks)
        finally:
            for t in tasks:
                t.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)

    # ------------------------------------------------------------------
    # Consumer group bootstrap
    # ------------------------------------------------------------------

    async def _ensure_consumer_group(self) -> None:
        try:
            await self._redis.xgroup_create(
                settings.redis_stream_in,
                settings.redis_consumer_group,
                id="0",
                mkstream=True,
            )
        except aioredis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
            logger.debug("Consumer group already exists: %s", settings.redis_consumer_group)

    # ------------------------------------------------------------------
    # Main consume loop
    # ------------------------------------------------------------------

    async def _consume_loop(self) -> None:
        _backoff = 1
        while True:
            try:
                entries = await self._redis.xreadgroup(
                    groupname=settings.redis_consumer_group,
                    consumername=settings.redis_consumer_name,
                    streams={settings.redis_stream_in: ">"},
                    count=settings.redis_read_count,
                    block=settings.redis_block_ms,
                )
                _backoff = 1
                if not entries:
                    continue
                for _stream, messages in entries:
                    for message_id, fields in messages:
                        await self._process(message_id, fields)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.error("XREADGROUP failed, retrying in %ds", _backoff, exc_info=True)
                await asyncio.sleep(_backoff)
                _backoff = min(_backoff * 2, 60)

    # ------------------------------------------------------------------
    # Autoclaim abandoned messages
    # ------------------------------------------------------------------

    async def _autoclaim_loop(self) -> None:
        cursor = "0-0"
        while True:
            await asyncio.sleep(30)
            try:
                result = await self._redis.xautoclaim(
                    settings.redis_stream_in,
                    settings.redis_consumer_group,
                    settings.redis_consumer_name,
                    min_idle_time=settings.redis_autoclaim_min_idle_ms,
                    start_id=cursor,
                    count=50,
                )
                next_cursor, claimed, _ = result
                cursor = next_cursor if next_cursor and next_cursor != b"0-0" else "0-0"

                for message_id, fields in claimed:
                    await self._process(message_id, fields)
            except Exception:
                logger.warning("XAUTOCLAIM iteration failed", exc_info=True)
                cursor = "0-0"

    # ------------------------------------------------------------------
    # Per-message processing
    # ------------------------------------------------------------------

    async def _process(self, message_id: bytes, fields: dict) -> None:
        payload_raw = fields.get(_PAYLOAD_FIELD)
        if not payload_raw:
            logger.warning("Stream entry %s missing payload field", message_id)
            await self._ack(message_id)
            return

        try:
            envelope = SynapseAggregatedEnvelope.model_validate_json(payload_raw)
        except (ValidationError, ValueError):
            logger.warning("Poison message, cannot deserialize. id=%s", message_id, exc_info=True)
            await self._ack(message_id)
            return

        if envelope.schema_version != 1:
            logger.error(
                "Unknown schema version %d, dropping. id=%s correlation=%s",
                envelope.schema_version, message_id, envelope.correlation_id,
            )
            await self._ack(message_id)
            return

        try:
            async with self._llm_sem:
                await self._stream_and_publish(envelope)
            await self._ack(message_id)
        except (httpx.HTTPStatusError, httpx.TransportError) as exc:
            # Transient Ollama errors (5xx, network issues, ReadTimeout).
            # Log and do NOT ACK — XAUTOCLAIM retries after min_idle_time.
            logger.warning(
                "Ollama request failed (will retry). id=%s correlation=%s error=%s",
                message_id,
                envelope.correlation_id,
                exc,
            )
        except Exception:
            logger.error(
                "Unexpected error processing message. id=%s correlation=%s",
                message_id,
                envelope.correlation_id,
                exc_info=True,
            )
            # Not ACK'd — XAUTOCLAIM will retry the full message after min_idle_time.

    # ------------------------------------------------------------------
    # LLM streaming + sentence accumulation + chunked publish
    # ------------------------------------------------------------------

    async def _stream_and_publish(self, envelope: SynapseAggregatedEnvelope) -> None:
        ctx = envelope.context
        model = ctx.llm_model if ctx else _FALLBACK_MODEL
        messages = build_messages(envelope)

        # TTS fields resolved upstream by ChannelContextResolutionService — forwarded verbatim
        tts_provider_id = ctx.tts_provider_id if ctx else None
        tts_voice_id    = ctx.tts_voice_id    if ctx else None
        tts_model_id    = ctx.tts_model_id    if ctx else None
        tts_speed       = ctx.tts_speed       if ctx else 1.0

        # LLM generation options from the card's llm_config — forwarded to Ollama
        llm_options: dict | None = None
        if ctx:
            llm_options = {
                "temperature": ctx.llm_temperature,
                "num_predict": ctx.llm_max_tokens,
                "top_p":       ctx.llm_top_p,
            }
            # repeat_penalty is Ollama's closest equivalent to frequency + presence penalty.
            # 1.0 = no penalty; > 1.0 = discourage repeated tokens.
            combined_penalty = ctx.llm_frequency_penalty + ctx.llm_presence_penalty
            if combined_penalty > 0:
                llm_options["repeat_penalty"] = 1.0 + combined_penalty

        # Response delay: LLM generation starts immediately; we sleep before the first
        # publish so the response appears in chat after the configured delay.
        response_delay_s = (
            (ctx.response_delay_ms / 1000.0) if ctx and ctx.response_delay_ms > 0 else 0.0
        )

        logger.info(
            "LLM request started. user=%s channel=%s model=%s correlation=%s",
            envelope.message.sender.user_name,
            envelope.message.channel_name,
            model,
            envelope.correlation_id,
        )

        try:
            mode = (
                ChunkingMode(ctx.chunking_mode)
                if ctx and ctx.chunking_mode
                else ChunkingMode.NARRATION
            )
        except ValueError:
            mode = ChunkingMode.NARRATION

        total_chars = 0
        first_token_logged = False

        async def _token_stream():
            nonlocal total_chars, first_token_logged
            async for llm_chunk in self._llm.chat_stream(
                model=model,
                messages=messages,
                correlation_id=envelope.correlation_id,
                options=llm_options,
            ):
                if not first_token_logged and llm_chunk.token:
                    logger.info(
                        "First LLM token received. model=%s correlation=%s",
                        model, envelope.correlation_id,
                    )
                    first_token_logged = True
                total_chars += len(llm_chunk.token)
                yield llm_chunk.token

        # Look-ahead: hold each sentence until the next arrives so the final chunk
        # always carries is_last=True and we never publish an empty terminal marker.
        seq = 0
        pending: tuple[str, int] | None = None
        first_publish = True

        token_gen = _token_stream()
        try:
            async for sentence in iter_sentences(token_gen, mode=mode):
                if pending is not None:
                    if first_publish and response_delay_s > 0:
                        logger.debug(
                            "Response delay %.1fs applied. correlation=%s",
                            response_delay_s,
                            envelope.correlation_id,
                        )
                        await asyncio.sleep(response_delay_s)
                        first_publish = False
                    await self._publish_chunk(
                        envelope=envelope,
                        text=pending[0],
                        model=model,
                        seq=pending[1],
                        is_last=False,
                        tts_provider_id=tts_provider_id,
                        tts_voice_id=tts_voice_id,
                        tts_model_id=tts_model_id,
                        tts_speed=tts_speed,
                    )
                pending = (sentence, seq)
                seq += 1
        finally:
            await token_gen.aclose()

        if pending is not None:
            if first_publish and response_delay_s > 0:
                logger.debug(
                    "Response delay %.1fs applied (single-chunk response). correlation=%s",
                    response_delay_s,
                    envelope.correlation_id,
                )
                await asyncio.sleep(response_delay_s)
            await self._publish_chunk(
                envelope=envelope,
                text=pending[0],
                model=model,
                seq=pending[1],
                is_last=True,
                tts_provider_id=tts_provider_id,
                tts_voice_id=tts_voice_id,
                tts_model_id=tts_model_id,
                tts_speed=tts_speed,
            )
        else:
            logger.warning(
                "LLM produced empty response. correlation=%s model=%s",
                envelope.correlation_id, model,
            )
            return

        logger.info(
            "LLM stream complete. channel=%s model=%s chunks=%d chars=%d correlation=%s",
            envelope.message.channel_name,
            model,
            seq,
            total_chars,
            envelope.correlation_id,
        )

    async def _publish_chunk(
        self,
        envelope: SynapseAggregatedEnvelope,
        text: str,
        model: str,
        seq: int,
        is_last: bool,
        tts_provider_id: str | None,
        tts_voice_id: str | None,
        tts_model_id: str | None,
        tts_speed: float,
    ) -> None:
        payload = json.dumps({
            "correlationId":  envelope.correlation_id,
            "channelId":      envelope.message.channel_id,
            "platformId":     envelope.message.platform_id,
            "text":           text,
            "model":          model,
            "sequenceNumber": seq,
            "isLast":         is_last,
            "voiceId":        tts_voice_id,
            "ttsProviderId":  tts_provider_id,
            "ttsModelId":     tts_model_id,
            "ttsSpeed":       tts_speed,
        })
        await self._redis.xadd(
            settings.redis_stream_out,
            {"payload": payload},
            maxlen=settings.redis_stream_out_maxlen,
            approximate=True,
        )
        if seq == 0:
            logger.info(
                "First chunk published → TTS pipeline started. channel=%s correlation=%s text=%r",
                envelope.message.channel_name,
                envelope.correlation_id,
                text[:60],
            )
        else:
            logger.debug(
                "Chunk published. seq=%d is_last=%s chars=%d correlation=%s",
                seq, is_last, len(text), envelope.correlation_id,
            )

    async def _ack(self, message_id: bytes) -> None:
        await self._redis.xack(
            settings.redis_stream_in,
            settings.redis_consumer_group,
            message_id,
        )
