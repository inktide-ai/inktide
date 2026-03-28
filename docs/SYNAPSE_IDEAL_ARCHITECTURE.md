# Chimera Synapse — Ideal Distributed Architecture

> Структурированность Production. Честность Rethink. Ни одного компонента без измеренной причины.

---

## Latency Budget

```
Сообщение получено → голос в эфире: < 4 000ms

  0 –   50ms   Ingest: active check, rate limit, sampling
 50 –  200ms   Pipeline: сборка контекста (Redis + Qdrant + DB параллельно)
200 – 3 000ms  vLLM: генерация ответа (75% бюджета — GPU bottleneck)
500 – 1 300ms  TTS: синтез первого предложения (ПАРАЛЛЕЛЬНО с хвостом LLM)

Голос звучит через ~1 300ms после получения сообщения.
LLM всё ещё генерирует остаток — TTS выходит из критического пути.
```

---

## 1. Design Principles

| Принцип | Что это значит |
|---------|----------------|
| GPU — центр дизайна | Все решения оцениваются через: "это помогает GPU или мешает?" |
| Streaming TTS = единственная latency оптимизация с реальным эффектом | ~800ms выигрыш vs speculative execution (~15ms) |
| Простой стек | Добавляй компонент только когда измерил что без него не справляешься |
| Деградация лучше блокировки | Нет RAG → отвечай без RAG. Нет истории → отвечай без истории |
| Latency важнее durability | Потеря одного session turn при 10K каналах — приемлемо. +200ms задержки на каждое сообщение — нет |
| Compile-time контракты | `IPipelineStage<TIn, TOut>` — ошибки на этапе компиляции |
| Observable by default | `traceId` рождается в Ingest, живёт до Publisher |

---

## 2. Technology Stack

```
┌──────────────────────────────────────────────────────────┐
│  DATA                                                    │
│                                                          │
│  Redis 7         — сессии, rate limit, fair queue,       │
│                    очередь (Streams), backpressure        │
│  PostgreSQL      — AiCards, конфиг, аналитика            │
│  Qdrant          — векторный поиск (RAG)                 │
│                                                          │
│  SERVING                                                 │
│                                                          │
│  vLLM            — LLM inference, continuous batching   │
│  Kokoro TTS      — синтез речи                          │
│                                                          │
│  TRANSPORT                                               │
│                                                          │
│  Redis Streams   — очередь с consumer groups, ACK, PEL  │
│                                                          │
│  WORKERS (.NET 10)                                       │
│                                                          │
│  Ingest Worker   — приём, rate limit, sampling           │
│  Pipeline Worker — контекст + LLM streaming + TTS       │
│  Publisher Worker— отправка в Twitch/Discord WebSocket   │
│                                                          │
│  OBSERVABILITY                                           │
│                                                          │
│  OpenTelemetry   — W3C TraceContext, distributed tracing │
│  Prometheus      — метрики                              │
│  Grafana         — дашборды и алерты                    │
└──────────────────────────────────────────────────────────┘
```

### Что убрано и почему

| Убрано | Причина |
|--------|---------|
| Kafka | Redis Streams: consumer groups, ACK, XCLAIM, retention — без ZooKeeper/KRaft/Schema Registry. Kafka нужен при > 50K msg/sec или replay за недели |
| Neo4j | `SELECT topic FROM channel_topics WHERE channel_id = ? ORDER BY weight DESC LIMIT 5` — это индекс, не граф |
| Consul | k8s DNS — встроенный service discovery |
| Counting Bloom Filter | 1% false positive = 1% реальных каналов получают drop. Redis `SISMEMBER` — O(1), атомарно, zero false positives |
| Transactional Outbox | +200ms polling latency на каждое сообщение. При 10K каналах потеря одного session turn — не катастрофа |
| Config-driven DAG | Pipeline одинаковый для всех AiCards. Абстракция нужна когда есть второй тип pipeline — не раньше |
| Schema Registry / Avro | JSON с backward-compat + version header. Avro — когда реально упрёшься в сериализацию |
| Speculative Execution | 15ms выигрыш. Streaming TTS даёт 800ms. Работаем над bottleneck |

---

## 3. System Overview

```
Twitch / Discord
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  INGEST WORKER  ×N (stateless, CPU-bound)                │
│                                                          │
│  1. Канал активен?   → Redis SISMEMBER O(1)              │
│  2. Rate limit?      → Redis Token Bucket (Lua, atomic)  │
│  3. Backpressure?    → читаем synapse:pipeline:depth     │
│  4. Sampling         → Donation=100% / Sub=70% / Reg=10% │
│  5. Публикуй         → Redis Stream: synapse.ingest      │
└──────────────────────────────────────────────────────────┘
      │ ~10% объёма
      ▼
Redis Stream: synapse.ingest  (key: channelId)
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  PIPELINE WORKER  ×M (I/O + GPU bound)                   │
│                                                          │
│  Stale check: > 10s → drop                               │
│                                                          │
│  Контекст (параллельно, 150ms общий таймаут):            │
│    → Redis: история разговора        (fallback: пусто)   │
│    → Qdrant: RAG воспоминания        (fallback: пусто)   │
│    → L1→L2→L3: AiCard конфиг        (required)          │
│                                                          │
│  vLLM: streaming генерация ответа                        │
│    ↓ первое предложение готово (~500ms)                  │
│  TTS: синтез параллельно ← КЛЮЧЕВОЕ                      │
│    ↓ пока LLM генерирует остаток                         │
│  TTS: следующие предложения по мере готовности           │
│                                                          │
│  Состояние (async best-effort, не блокирует ответ):      │
│    → Redis: обновить историю                             │
│    → Qdrant: memory ingestion                            │
│                                                          │
│  INCR synapse:pipeline:depth на входе                    │
│  DECR synapse:pipeline:depth на выходе                   │
└──────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  PUBLISHER WORKER  ×K (stateless, network-bound)         │
│  Twitch / Discord WebSocket                              │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Transport — Redis Streams

### Stream topology

```
Stream                  Key          Retention        Consumer Group
──────────────────────  ───────────  ───────────────  ──────────────────
synapse.ingest          channelId    MAXLEN ~50 000   pipeline-workers
synapse.response        channelId    MAXLEN ~10 000   publisher-workers
```

### Почему Redis Streams, не Kafka

Redis Streams поддерживает всё необходимое:
- Consumer groups с ACK — никакой потери при аварии
- `XREADGROUP BLOCK` — эффективный polling без busy loop
- `XAUTOCLAIM` — автоматическое переназначение зависших сообщений
- `MAXLEN ~N` — retention последних N сообщений
- Всё это уже есть в Redis, который стоит в любом случае

```csharp
// Pipeline Worker — consumer loop
public sealed class PipelineBackgroundService : BackgroundService
{
    private const string Stream    = "synapse.ingest";
    private const string Group     = "pipeline-workers";
    private const string Consumer  = "pipeline-{instanceId}";
    private const int    BatchSize = 16; // не перегружать GPU очередь

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await EnsureGroupExistsAsync();

        // Параллельно: основной цикл + XAUTOCLAIM для зависших сообщений
        await Task.WhenAll(
            ConsumeLoopAsync(ct),
            ClaimOrphanedMessagesAsync(ct)
        );
    }

    private async Task ConsumeLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var entries = await _redis.StreamReadGroupAsync(
                Stream, Group, _consumerId,
                count: BatchSize,
                noAck: false,
                blockMilliseconds: 2000
            );

            foreach (var entry in entries)
            {
                await _processor.ProcessAsync(entry, ct);
                await _redis.StreamAcknowledgeAsync(Stream, Group, entry.Id);
            }
        }
    }

    // Подбираем сообщения которые зависли > 30s (воркер упал не ack-нув)
    private async Task ClaimOrphanedMessagesAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(30), ct);

            var claimed = await _redis.StreamAutoClaimAsync(
                Stream, Group, _consumerId,
                minIdleTimeInMs: 30_000,
                startAt: "0-0",
                count: 50
            );

            foreach (var entry in claimed.Entries)
                await _processor.ProcessAsync(entry, ct);
        }
    }
}
```

---

## 5. Ingest Worker

### Active channels — Redis SET (не Bloom Filter)

```csharp
/// <summary>
/// Redis SET вместо Counting Bloom Filter.
///
/// Bloom Filter имеет 1% false positive rate — реальные каналы получают drop.
/// SISMEMBER — O(1), атомарно, zero false positives.
/// RENAME trick — атомарная замена SET, нет окна где set пуст.
/// </summary>
public sealed class ActiveChannelCache
{
    private const string Key    = "synapse:active_channels";
    private const string TmpKey = "synapse:active_channels:tmp";

    public async Task<bool> IsActiveAsync(string channelId)
        => await _redis.SetContainsAsync(Key, channelId);

    // Вызывается каждые 30 секунд из BackgroundService
    public async Task RefreshAsync(IEnumerable<string> channelIds, CancellationToken ct)
    {
        var batch = _redis.CreateBatch();
        _ = batch.KeyDeleteAsync(TmpKey);
        _ = batch.SetAddAsync(TmpKey, channelIds.Select(id => (RedisValue)id).ToArray());
        _ = batch.KeyRenameAsync(TmpKey, Key); // атомарно — нет окна где set пуст
        batch.Execute();
    }
}
```

### Rate limit — Redis Token Bucket (Lua)

```lua
-- Atomic Lua script — runs as a single Redis command (no race conditions)
-- KEYS[1] = "rate:{userId}"
-- ARGV[1] = capacity, ARGV[2] = refill_rate (tokens/sec), ARGV[3] = now (unix ms)

local key         = KEYS[1]
local capacity    = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now         = tonumber(ARGV[3])

local data     = redis.call('HMGET', key, 'tokens', 'last_ms')
local tokens   = tonumber(data[1]) or capacity
local last_ms  = tonumber(data[2]) or now

local elapsed_sec = (now - last_ms) / 1000.0
tokens = math.min(capacity, tokens + elapsed_sec * refill_rate)

if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last_ms', now)
    redis.call('PEXPIRE', key, 3600000)
    return 1   -- allowed
end
return 0       -- rejected
```

```csharp
public sealed class RedisTokenBucket
{
    // capacity = burst, rate = sustained tokens/sec
    private static readonly (int Capacity, double Rate)[] Tiers =
    [
        /* Donation    */ (200, 50.0),
        /* Broadcaster */ (100, 20.0),
        /* Subscriber  */ (20,  2.0),
        /* Regular     */ (5,   0.5),
    ];

    public async Task<bool> TryAcquireAsync(string userId, UserTier tier, CancellationToken ct)
    {
        var (capacity, rate) = Tiers[(int)tier];
        var result = await _redis.ScriptEvaluateAsync(
            _script,
            keys:   [$"rate:{userId}"],
            values: [(RedisValue)capacity, (RedisValue)rate,
                     (RedisValue)DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()]
        );
        return (int)result == 1;
    }
}
```

### Sampling с backpressure

```csharp
public sealed class IngestStage : IPipelineStage<ChatMessage, IngestEnvelope>
{
    public async Task<StageResult<IngestEnvelope>> ExecuteAsync(ChatMessage msg, CancellationToken ct)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("ingest");
        activity?.SetTag("channel.id", msg.ChannelId);

        // 1. Канал активен — zero DB I/O
        if (!await _channels.IsActiveAsync(msg.ChannelId))
            return StageResult<IngestEnvelope>.Drop("channel_inactive");

        // 2. Per-user rate limit — один Lua вызов
        var tier = ResolveTier(msg.Sender);
        if (!await _tokenBucket.TryAcquireAsync(msg.Sender.UserId, tier, ct))
            return StageResult<IngestEnvelope>.Drop("rate_limited");

        // 3. Backpressure от Pipeline workers (обновляется через INCR/DECR)
        var depth       = (long)await _redis.StringGetAsync("synapse:pipeline:depth");
        var loadFactor  = Math.Clamp(1.0 - depth / 1000.0, 0.1, 1.0);

        // Jitter ±10% — предотвращает thundering herd при восстановлении
        var jitter    = 1.0 + (Random.Shared.NextDouble() - 0.5) * 0.2;
        var threshold = tier switch
        {
            UserTier.Donation    => 1.00,
            UserTier.Broadcaster => 1.00,
            UserTier.Subscriber  => 0.70 * loadFactor * jitter,
            _                    => 0.10 * loadFactor * jitter,
        };

        if (Random.Shared.NextDouble() >= threshold)
            return StageResult<IngestEnvelope>.Drop("sampled_out");

        var priority = tier switch
        {
            UserTier.Donation    => 100,
            UserTier.Broadcaster => 90,
            UserTier.Subscriber  => 70,
            _                    => 10,
        };

        activity?.SetTag("ingest.tier",     tier.ToString());
        activity?.SetTag("ingest.priority", priority);
        activity?.SetTag("ingest.depth",    depth);

        return StageResult<IngestEnvelope>.Ok(new IngestEnvelope(
            Message:    msg,
            Priority:   priority,
            TraceId:    activity?.Id ?? Guid.NewGuid().ToString("N"),
            EnqueuedAt: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        ));
    }
}
```

---

## 6. Pipeline Worker

### Typed pipeline contract

```csharp
// Compile-time contracts — ошибки несовместимости этапов видны при сборке
public interface IPipelineStage<TIn, TOut>
{
    Task<StageResult<TOut>> ExecuteAsync(TIn input, CancellationToken ct);
}

public readonly record struct StageResult<T>
{
    public T?     Value    { get; init; }
    public bool   IsOk     { get; init; }
    public string? DropReason { get; init; }

    public static StageResult<T> Ok(T value)          => new() { Value = value, IsOk = true };
    public static StageResult<T> Drop(string reason)  => new() { IsOk = false, DropReason = reason };
}
```

### Три уровня кэша для AiCard

```
L1: ConcurrentDictionary<string, AiCardContext>   process memory
    TTL: 5 минут, выдавливается MemoryCache pressure
    Hit: ~99% для активных каналов

L2: Redis HGET "ctx:channel:{channelId}"
    TTL: 5 минут
    Hit: ~99.9% при L1 miss (только cold start)

L3: PostgreSQL JOIN (ai_card_channels → ai_cards → llm_catalog)
    Hit: < 0.1%
    При L3 hit: populate L2 и L1
```

```csharp
public sealed class AiCardResolver
{
    public async Task<AiCardContext?> ResolveAsync(string channelId, CancellationToken ct)
    {
        // L1
        if (_localCache.TryGetValue(channelId, out AiCardContext? cached))
        {
            _metrics.CacheHit.Inc("l1");
            return cached;
        }

        // L2
        var redisKey = $"ctx:channel:{channelId}";
        var raw = await _redis.HashGetAllAsync(redisKey);
        if (raw.Length > 0)
        {
            var fromRedis = Deserialize(raw);
            _localCache.Set(channelId, fromRedis, TimeSpan.FromMinutes(5));
            _metrics.CacheHit.Inc("l2");
            return fromRedis;
        }

        // L3
        var fromDb = await _db.AiCardChannels
            .AsNoTracking()
            .Include(c => c.AiCard)
            .Where(c => c.ChannelId == channelId && c.IsActive)
            .Select(c => c.AiCard)
            .FirstOrDefaultAsync(ct);

        if (fromDb is null) return null;

        var ctx = Map(fromDb);
        await _redis.HashSetAsync(redisKey, Serialize(ctx));
        await _redis.KeyExpireAsync(redisKey, TimeSpan.FromMinutes(5));
        _localCache.Set(channelId, ctx, TimeSpan.FromMinutes(5));

        _metrics.CacheHit.Inc("l3");
        return ctx;
    }
}
```

### Сборка контекста — параллельно с circuit breaker

```csharp
public sealed class ContextStage : IPipelineStage<IngestEnvelope, ContextEnvelope>
{
    public async Task<StageResult<ContextEnvelope>> ExecuteAsync(IngestEnvelope input, CancellationToken ct)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("context.assemble");

        var aiCard = await _aiCardResolver.ResolveAsync(input.Message.ChannelId, ct);
        if (aiCard is null)
        {
            await _channels.RemoveAsync(input.Message.ChannelId); // evict stale entry
            return StageResult<ContextEnvelope>.Drop("no_aicard");
        }

        // Все три запроса параллельно. Общий таймаут 150ms.
        // Каждый источник — отдельный circuit breaker + fallback.
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(150);

        var historyTask = _redis
            .GetHistoryAsync(input.Message.ChannelId, cts.Token)
            .WithFallback(SessionContext.Empty, onFallback: () =>
                _metrics.ContextDegraded.Inc("history"));

        var ragTask = _qdrantCb.ExecuteAsync(
            execute:  () => _qdrant.SearchAsync(aiCard.Id, input.Message.Text, cts.Token),
            fallback: RagContext.Empty,
            timeout:  TimeSpan.FromMilliseconds(120),
            onFallback: () => _metrics.ContextDegraded.Inc("rag"));

        // Параллельно ждём оба — total latency = max(history, rag)
        await Task.WhenAll(historyTask, ragTask);

        var session = await historyTask;
        var rag     = await ragTask;

        activity?.SetTag("context.rag_memories",   rag.Memories.Count);
        activity?.SetTag("context.history_turns",  session.History.Count);
        activity?.SetTag("context.rag_degraded",   rag == RagContext.Empty);
        activity?.SetTag("context.hist_degraded",  session == SessionContext.Empty);

        return StageResult<ContextEnvelope>.Ok(new ContextEnvelope(input, aiCard, session, rag));
    }
}
```

### LLM Streaming + параллельный TTS — ключевая оптимизация

```
БЕЗ STREAMING:
├── Context 150ms ──┤
                    ├──────── LLM 2800ms ────────┤
                                                 ├── TTS 800ms ──┤
                                                                  ▲ 3750ms

СО STREAMING TTS (этот дизайн):
├── Context 150ms ──┤
                    ├──────── LLM 2800ms ────────┤
                    ├─ first sentence ~500ms ─┤
                                              ├── TTS 800ms ──┤
                                                               ▲ 1450ms
                                              (остаток LLM всё ещё идёт,
                                               голос уже звучит)
```

```csharp
public sealed class LlmStage : IPipelineStage<ContextEnvelope, LlmEnvelope>
{
    public async Task<StageResult<LlmEnvelope>> ExecuteAsync(ContextEnvelope input, CancellationToken ct)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("llm.generate");

        // Stale check — не тратить GPU на сообщение которое уже не актуально
        var ageMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - input.Ingest.EnqueuedAt;
        if (ageMs > 10_000)
        {
            _metrics.DroppedStale.Inc();
            activity?.SetTag("llm.dropped", "stale");
            return StageResult<LlmEnvelope>.Drop("stale");
        }

        var prompt   = _promptBuilder.Build(input);
        var fullText = new StringBuilder();
        var sentence = new StringBuilder();

        await foreach (var token in _vllm.StreamAsync(prompt, ct))
        {
            fullText.Append(token.Text);
            sentence.Append(token.Text);

            // Первое предложение завершено → немедленно в TTS, не ждать конца LLM
            if (token.IsSentenceBoundary && sentence.Length > 0)
            {
                var chunk = sentence.ToString();
                sentence.Clear();

                // Запускаем TTS и не ждём — он идёт параллельно с остатком LLM
                // ContinueWith — ошибки не глотаются, логируются
                _ = _tts.SynthesizeAndPublishAsync(chunk, input.Ingest.Message.ChannelId, ct)
                    .ContinueWith(
                        t => _logger.LogError(t.Exception, "TTS failed for channel {Id}",
                                              input.Ingest.Message.ChannelId),
                        ct,
                        TaskContinuationOptions.OnlyOnFaulted,
                        TaskScheduler.Default);
            }
        }

        var response = new LlmResponse(fullText.ToString());
        activity?.SetTag("llm.tokens", fullText.Length / 4); // ~4 chars/token

        return StageResult<LlmEnvelope>.Ok(new LlmEnvelope(input, response));
    }
}
```

### State update — best-effort с метриками (не Outbox)

```csharp
/// Outbox добавляет ~200ms polling latency на каждое сообщение.
/// При 10K каналах потеря одного session turn — приемлемо.
/// Stale данные через 500ms бесполезны в любом случае.
/// Метрика покажет если потери станут систематическими.
private async Task UpdateStateAsync(
    ContextEnvelope ctx, LlmResponse response, CancellationToken ct)
{
    try
    {
        // 200ms — максимум что можем потратить без влияния на следующее сообщение
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(200);

        await Task.WhenAll(
            _redis.AppendHistoryAsync(
                ctx.Ingest.Message.ChannelId,
                ctx.Ingest.Message.Text,
                response.Text,
                cts.Token),
            _qdrantCb.ExecuteAsync(
                () => _memory.IngestAsync(ctx.Ingest.Message, response, cts.Token),
                fallback: Task.CompletedTask,
                timeout: TimeSpan.FromMilliseconds(180))
        );
    }
    catch (Exception ex)
    {
        // Не бросаем — это best-effort путь
        _metrics.StateUpdateFailed.Inc();
        _logger.LogWarning(ex, "State update failed for channel {ChannelId}",
                           ctx.Ingest.Message.ChannelId);
    }
}
```

---

## 7. Backpressure

```
Pipeline Worker: INCR synapse:pipeline:depth на старте обработки
                 DECR synapse:pipeline:depth на завершении

Ingest Worker: читает depth, снижает sampling пропорционально

depth < 200:   нормальная работа
depth 200–400: loadFactor = 0.7  (subscriber sampling: 0.70 * 0.7 = 0.49)
depth 400–700: loadFactor = 0.4
depth > 700:   loadFactor = 0.1  (только donations + broadcasters)

Jitter ±10% на каждом Ingest инстансе → нет thundering herd при recovery
```

```csharp
// Атомарный счётчик — нет race condition при нескольких воркерах
public sealed class PipelineDepthTracker : IAsyncDisposable
{
    private const string Key = "synapse:pipeline:depth";

    public static async Task<PipelineDepthTracker> AcquireAsync(IDatabase redis)
    {
        await redis.StringIncrementAsync(Key);
        return new PipelineDepthTracker(redis);
    }

    public async ValueTask DisposeAsync()
        => await _redis.StringDecrementAsync(Key);
}

// Использование в Pipeline Worker:
await using var _ = await PipelineDepthTracker.AcquireAsync(_redis);
await _processor.ProcessAsync(message, ct);
// DECR вызывается автоматически при выходе из scope (включая исключения)
```

---

## 8. Observability

### Три метрики которые важны

```
1. synapse_e2e_latency_ms
   От получения сообщения до первого звука в эфире.
   SLO: p95 < 4 000ms
   Алерт: p95 > 3 500ms за 5 минут

2. synapse_context_degraded_rate
   % сообщений ответ на которые сгенерирован без истории или без RAG.
   Алерт: > 5% за 5 минут = что-то сломалось в Redis или Qdrant

3. synapse_gpu_queue_depth
   Глубина очереди к vLLM.
   Алерт: > 200 за 2 минуты = нужен ещё GPU инстанс
```

### Трейсинг — W3C TraceContext через Redis Streams

```csharp
// TraceId рождается в Ingest, пробрасывается через Stream headers
// В каждом воркере: activity?.SetTag / activity?.AddEvent
// Jaeger/Tempo покажет полный путь: Ingest → Pipeline → TTS → Publisher

public static class StreamPropagation
{
    public static NameValueEntry[] ToStreamHeaders(Activity? activity) =>
    [
        new("traceparent", activity?.Id ?? string.Empty),
        new("tracestate",  activity?.TraceStateString ?? string.Empty),
    ];

    public static ActivityContext FromStreamHeaders(StreamEntry entry)
    {
        var traceparent = entry["traceparent"].ToString();
        ActivityContext.TryParse(traceparent, null, out var ctx);
        return ctx;
    }
}
```

### Ключевые теги на каждом activity

```csharp
// Ingest
activity?.SetTag("channel.id",       msg.ChannelId);
activity?.SetTag("ingest.tier",      tier.ToString());
activity?.SetTag("ingest.decision",  "pass" | "drop");
activity?.SetTag("ingest.drop_reason", reason);

// Context
activity?.SetTag("context.rag_memories",  rag.Memories.Count);
activity?.SetTag("context.hist_turns",    session.History.Count);
activity?.SetTag("context.rag_degraded",  rag == RagContext.Empty);
activity?.SetTag("context.hist_degraded", session == SessionContext.Empty);

// LLM
activity?.SetTag("llm.model",     aiCard.LlmModel);
activity?.SetTag("llm.tokens",    estimatedTokens);
activity?.SetTag("llm.dropped",   "stale" | null);

// E2E
activity?.SetTag("e2e.latency_ms", totalMs);
```

---

## 9. PostgreSQL Schema

```sql
-- AiCard конфиг (core)
CREATE TABLE soul.ai_cards (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    llm_model     TEXT NOT NULL DEFAULT 'mistral-7b-instruct',
    max_memories  INT  NOT NULL DEFAULT 5,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Привязка каналов к AI-персонажам
CREATE TABLE soul.ai_card_channels (
    channel_id  TEXT NOT NULL,
    ai_card_id  UUID NOT NULL REFERENCES soul.ai_cards(id),
    is_active   BOOL NOT NULL DEFAULT true,
    PRIMARY KEY (channel_id)
);

CREATE INDEX idx_ai_card_channels_active
    ON soul.ai_card_channels (channel_id)
    WHERE is_active = true;

-- Топики канала (заменяет Neo4j — это один индекс, не граф)
CREATE TABLE soul.channel_topics (
    channel_id   TEXT NOT NULL,
    topic        TEXT NOT NULL,
    weight       FLOAT NOT NULL DEFAULT 1.0,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (channel_id, topic)
);

CREATE INDEX idx_channel_topics_weight
    ON soul.channel_topics (channel_id, weight DESC);
-- Запрос: SELECT topic FROM channel_topics
--         WHERE channel_id = ? ORDER BY weight DESC LIMIT 5

-- Аналитика (async insert, не критический путь)
CREATE TABLE synapse.message_events (
    id          BIGSERIAL PRIMARY KEY,
    channel_id  TEXT NOT NULL,
    trace_id    TEXT NOT NULL,
    tier        TEXT NOT NULL,
    outcome     TEXT NOT NULL, -- 'pass' | 'drop_inactive' | 'drop_rate' | 'drop_stale' | 'drop_sampled'
    latency_ms  INT,
    created_at  TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_message_events_channel
    ON synapse.message_events (channel_id, created_at DESC);
```

---

## 10. Deployment

```yaml
services:

  # Единственный компонент где нужен GPU — всё остальное вокруг него
  vllm:
    image: vllm/vllm-openai:latest
    command: >
      --model mistralai/Mistral-7B-Instruct-v0.3
      --max-num-seqs 64
      --gpu-memory-utilization 0.90
      --enable-prefix-caching
    deploy:
      replicas: 2           # +1 replica = +GPU = +throughput
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

  synapse-ingest:
    image: chimera/synapse-ingest:latest
    deploy:
      replicas: 3           # CPU-bound, stateless — скейлится тривиально
      resources:
        limits: { cpus: "1", memory: 256M }

  synapse-pipeline:
    image: chimera/synapse-pipeline:latest
    deploy:
      replicas: 4           # I/O bound + GPU calls
      resources:
        limits: { cpus: "2", memory: 1G }

  synapse-publisher:
    image: chimera/synapse-publisher:latest
    deploy:
      replicas: 2
      resources:
        limits: { cpus: "1", memory: 256M }

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 4gb --maxmemory-policy allkeys-lru

  postgres:
    image: postgres:16-alpine

  qdrant:
    image: qdrant/qdrant:v1.9.0

  prometheus:
    image: prom/prometheus:v2.51.0

  grafana:
    image: grafana/grafana:10.4.0
```

---

## 11. Scaling Model

```
1 GPU (A100, Mistral-7B, vLLM continuous batching):
  ~80 requests/sec

После Gate (~10% от входящих):
  5 000 msg/sec → 500 req/sec нужно
  → 7 GPU инстансов для 10K каналов в пике

Pipeline Workers: один на вLLM инстанс, I/O bound
Ingest Workers:   stateless, CPU bound — 1 на каждые 2 GPU инстанса
Publisher:        stateless, network bound — 1-2 инстанса

Масштабирование:
  +GPU = +vLLM инстанс = +Pipeline Worker
  Redis / PostgreSQL / Qdrant не bottleneck при этой нагрузке
```

---

## 12. Когда добавлять что

| Сигнал | Действие |
|--------|----------|
| `synapse_gpu_queue_depth` стабильно > 200 | Добавить vLLM инстанс + Pipeline Worker |
| Redis CPU > 60% | Вынести rate limit в отдельный Redis инстанс |
| Qdrant latency p99 > 50ms | Увеличить memory, добавить payload индекс |
| PostgreSQL slow queries | Добавить индекс → read replica → партиционирование |
| > 5 принципиально разных типа pipeline у разных AiCards | Тогда config-driven DAG |
| Нужен replay сообщений за дни | Тогда Kafka |
| Нужны graph traversals (3+ hop) | Тогда Neo4j |
| Throughput > 50 000 msg/sec | Тогда Redis Cluster |

---

## Сравнение всех трёх архитектур

| Аспект | Production | Rethink | **Ideal (этот документ)** |
|--------|-----------|---------|--------------------------|
| Компонентов | 11+ | 7 | **7** |
| Bottleneck правильно определён | Нет | Да | **Да** |
| Latency оптимизация | +15ms (speculative) | +800ms (streaming TTS) | **+800ms** |
| False positives на активных каналах | Да (Bloom 1%) | Нет | **Нет** |
| Outbox latency overhead | +200ms | Нет | **Нет** |
| Typed pipeline contracts | Да | Нет | **Да** |
| L1/L2/L3 AiCard cache | Да | Нет | **Да** |
| Правильный circuit breaker | Да | Частично | **Да** |
| Правильный Task.WhenAll | Нет | Нет | **Да** |
| Fire-and-forget без обработки ошибок | Нет | Да | **Нет** |
| XAUTOCLAIM для PEL recovery | — | Нет | **Да** |
| Backpressure через INCR/DECR | Нет | Нет (SET) | **Да** |
| Трейсинг через transport | Да (Kafka headers) | Нет | **Да (Stream headers)** |
