# Inktide Synapse — Архитектура с нуля

> Проектируем вокруг реального bottleneck, а не вокруг красивых паттернов.

---

## Честный старт: в чём задача

Пользователь пишет в Twitch/Discord чат стримера.
AI-стример должен ответить.
Ответ должен быть голосом — через TTS — пока стрим живой.

**Latency budget:** сообщение получено → голос в эфире = **< 4 секунды**.

Из них:
- 0–50ms: приём, rate limit, принятие решения
- 50–200ms: сборка контекста (история, RAG)
- 200–3000ms: LLM генерирует ответ (это 75% бюджета)
- 3000–4000ms: TTS синтезирует первые слова

Из этого следует главный вывод: **GPU — единственное узкое место**.
Всё остальное должно быть простым, чтобы не мешать GPU работать.

---

## Принципы (честные)

| Принцип | Что это значит на практике |
|---------|---------------------------|
| Проектируй вокруг bottleneck | GPU — центр. Всё остальное — pipeline к нему |
| Минимальный стек | Добавляй компонент только когда измерил что без него не справляешься |
| Latency важнее durability | Real-time: stale сообщение = бесполезное сообщение |
| Простое масштабирование | Добавить GPU = добавить vLLM инстанс. Всё |
| Деградация лучше блокировки | Нет RAG → отвечай без RAG. Нет истории → отвечай без истории |

---

## Стек

```
┌─────────────────────────────────────────────────────┐
│  DATA                                               │
│                                                     │
│  Redis 7        — сессии, rate limit, очередь       │
│  PostgreSQL     — AiCards, конфиг, аналитика        │
│  Qdrant         — векторный поиск (RAG)             │
│                                                     │
│  SERVING                                            │
│                                                     │
│  vLLM           — LLM inference, continuous batch   │
│  Kokoro TTS     — синтез речи                       │
│                                                     │
│  TRANSPORT                                          │
│                                                     │
│  Redis Streams  — очередь сообщений                 │
│                                                     │
│  WORKERS (.NET 10)                                  │
│                                                     │
│  Ingest         — приём, rate limit, фильтрация     │
│  Pipeline       — контекст + LLM + TTS              │
│  Publisher      — отправка ответа в Twitch/Discord  │
│                                                     │
│  OBSERVABILITY                                      │
│                                                     │
│  OpenTelemetry  — трейсинг                          │
│  Prometheus     — метрики                           │
│  Grafana        — дашборды и алерты                 │
└─────────────────────────────────────────────────────┘
```

**Что убрано и почему:**

| Убрано | Причина |
|--------|---------|
| Kafka | Redis Streams даёт consumer groups, replay, retention — без ZooKeeper/KRaft и Schema Registry |
| Neo4j | Таблица в PostgreSQL с индексом покрывает 99% graph-like запросов для стриминга |
| Consul | k8s DNS / Docker overlay network — встроенный service discovery |
| Counting Bloom Filter | Redis `SISMEMBER` — O(1), атомарно, не имеет race conditions при refresh |
| Transactional Outbox | Для session turns — async с метрикой потерь. Stale данные через 500ms не catастрофа |
| Config-driven DAG | Pipeline одинаковый для всех. Абстракция нужна когда есть второй pipeline — не раньше |
| Schema Registry | Версионирование через header + backward-compat JSON. Avro — когда реально упрёшься |

---

## Системная схема

```
Twitch / Discord
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  INGEST WORKER  ×N                                  │
│                                                     │
│  1. Канал активен? → Redis SISMEMBER O(1)           │
│  2. Rate limit? → Redis Token Bucket (Lua)          │
│  3. Sampling → Donation=100% / Sub=70% / Reg=10%   │
│  4. Публикуй в Redis Stream: chat.input             │
└─────────────────────────────────────────────────────┘
      │ ~10% объёма
      ▼
Redis Stream: synapse.pipeline (key: channelId)
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  PIPELINE WORKER  ×M                                │
│                                                     │
│  Контекст (параллельно, 100ms timeout каждый):      │
│    → Redis: история разговора                       │
│    → Qdrant: RAG (релевантные воспоминания)         │
│    → PostgreSQL: AiCard конфиг                      │
│                                                     │
│  Просрочено? (> 10s) → drop                         │
│                                                     │
│  vLLM: генерация ответа (streaming)                 │
│    ↓ первые токены                                  │
│  TTS: синтез пока LLM ещё генерирует ←── ключевое  │
│                                                     │
│  Запись в Redis: обновить историю (async, best effort) │
│  Запись в Qdrant: memory ingestion (async, best effort)│
└─────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  PUBLISHER WORKER  ×K                               │
│  Twitch / Discord WebSocket                         │
└─────────────────────────────────────────────────────┘
```

---

## Почему Redis Streams, не Kafka

Redis Streams поддерживает:
- Consumer groups с ACK — никакой потери сообщений
- `XREADGROUP BLOCK` — эффективный polling без busy loop
- `XCLAIM` — переназначение зависших сообщений другому воркеру
- Retention по времени: `MAXLEN ~10000` — последние N сообщений
- Всё это уже есть в Redis который у тебя и так стоит

```
Kafka нужен когда:
  - несколько независимых команд читают один поток
  - нужен replay за дни/недели
  - throughput > 1M msg/sec
  - compliance требует log retention

Здесь ничего из этого нет.
```

---

## Ingest Worker — фильтрация без лишнего

### Активные каналы — Redis SET

```csharp
// Обновляется каждые 30 секунд из PostgreSQL
// SISMEMBER — O(1), атомарно, нет race condition при refresh
// В отличие от Bloom Filter: нет false positives, нет окна пустого фильтра

public sealed class ActiveChannelCache
{
    private const string Key = "synapse:active_channels";

    public async Task<bool> IsActiveAsync(string channelId)
        => await _redis.SetContainsAsync(Key, channelId);

    // Refresh: RENAME трюк — атомарная замена всего set
    public async Task RefreshAsync(IEnumerable<string> channelIds, CancellationToken ct)
    {
        const string tmpKey = "synapse:active_channels:tmp";

        var batch = _redis.CreateBatch();
        _ = batch.KeyDeleteAsync(tmpKey);
        _ = batch.SetAddAsync(tmpKey, channelIds.Select(id => (RedisValue)id).ToArray());
        _ = batch.KeyRenameAsync(tmpKey, Key);  // атомарно — нет окна где set пуст
        batch.Execute();
    }
}
```

### Rate limit — тот же Token Bucket, без изменений

Lua-скрипт из предыдущего дизайна правильный — оставляем.

### Sampling — честный, с backpressure

```csharp
public sealed class IngestStage
{
    public async Task<bool> ShouldProcessAsync(ChatMessage msg, CancellationToken ct)
    {
        // 1. Канал активен
        if (!await _channels.IsActiveAsync(msg.ChannelId)) return false;

        // 2. Rate limit
        var tier = ResolveTier(msg.Sender);
        if (!await _tokenBucket.TryAcquireAsync(msg.Sender.UserId, tier, ct)) return false;

        // 3. Backpressure от Pipeline workers
        var queueDepth = (long)await _redis.StringGetAsync("synapse:pipeline:depth");
        var loadFactor = Math.Clamp(1.0 - queueDepth / 500.0, 0.1, 1.0);

        // 4. Sampling
        var threshold = tier switch
        {
            UserTier.Donation    => 1.00,
            UserTier.Broadcaster => 1.00,
            UserTier.Subscriber  => 0.70 * loadFactor,
            _                    => 0.10 * loadFactor,
        };

        return Random.Shared.NextDouble() < threshold;
    }
}
```

---

## Pipeline Worker — вокруг GPU

### Главная идея: streaming TTS параллельно с LLM

Стандартный подход:
```
LLM генерирует ... 3000ms ... готово → TTS синтезирует ... 800ms ... голос
Total: 3800ms
```

Правильный подход:
```
LLM стримит токены →
  первые 20 токенов (первое предложение) →
    TTS начинает синтез параллельно с остатком LLM
Total: 3000ms + 0ms TTS overhead (идёт параллельно)
```

Это единственная оптимизация latency которая имеет реальный смысл.

```csharp
public sealed class PipelineWorker
{
    public async Task ProcessAsync(ChatMessage msg, CancellationToken ct)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("pipeline");
        activity?.SetTag("channel.id", msg.ChannelId);

        // Stale check первым делом — не тратить GPU на старое
        if (IsStale(msg, maxAgeMs: 10_000))
        {
            _metrics.DroppedStale.Inc();
            return;
        }

        // Контекст параллельно — всё с circuit breaker и fallback
        var context = await AssembleContextAsync(msg, ct);

        // Streaming generation → параллельный TTS
        await foreach (var chunk in _vllm.StreamAsync(BuildPrompt(msg, context), ct))
        {
            // Первое предложение готово → отдаём в TTS не дожидаясь конца
            if (chunk.IsSentenceBoundary)
                _ = _tts.SynthesizeAndPublishAsync(chunk.Text, msg.ChannelId, ct);
        }

        // Обновляем состояние async — не блокируем ответ
        _ = UpdateStateAsync(msg, context, ct);
    }
}
```

### Сборка контекста

```csharp
private async Task<PipelineContext> AssembleContextAsync(ChatMessage msg, CancellationToken ct)
{
    // L1: process memory (живёт пока инстанс жив — тоже ок, тёплый cache)
    if (_localCache.TryGet(msg.ChannelId, out var aiCard))
    {
        _metrics.CacheHits.Inc("l1");
    }
    else
    {
        // L2: Redis → L3: PostgreSQL
        aiCard = await ResolveAiCardAsync(msg.ChannelId, ct);
    }

    // Параллельно с реалистичными timeout'ами
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
    cts.CancelAfter(150); // общий бюджет на контекст

    var historyTask = _redis.GetHistoryAsync(msg.ChannelId)
        .WithFallback(ConversationHistory.Empty);

    var ragTask = _qdrantCb.ExecuteAsync(
        () => _qdrant.SearchAsync(aiCard.Id, msg.Text, ct),
        fallback: RagResult.Empty,
        timeout: TimeSpan.FromMilliseconds(120));

    var (history, rag) = await (historyTask, ragTask).WhenAll();

    // Метрика деградации — видим в Grafana когда реально проблема
    if (history == ConversationHistory.Empty) _metrics.ContextDegraded.Inc("history");
    if (rag == RagResult.Empty) _metrics.ContextDegraded.Inc("rag");

    return new PipelineContext(aiCard, history, rag);
}
```

### Обновление состояния — async best-effort с метрикой

```csharp
private async Task UpdateStateAsync(ChatMessage msg, PipelineContext ctx, LlmResponse response, CancellationToken ct)
{
    // Не Outbox. Просто async с circuit breaker.
    // Потеря одного session turn при 10K каналах — приемлемо.
    // Задержка 100% session turns на 200ms через Outbox polling — нет.

    try
    {
        var tasks = new[]
        {
            _redis.AppendHistoryAsync(msg.ChannelId, msg.Text, response.Text),
            _qdrantCb.ExecuteAsync(() => _memory.IngestAsync(msg, response, ct))
        };

        await Task.WhenAll(tasks).WaitAsync(TimeSpan.FromMilliseconds(200), ct);
    }
    catch (Exception ex)
    {
        // Не бросаем — логируем, считаем метрику
        _metrics.StateUpdateFailed.Inc();
        _logger.LogWarning(ex, "State update failed for channel {ChannelId}", msg.ChannelId);
    }
}
```

---

## Масштабирование — честная модель

Единственный способ увеличить throughput — добавить GPU.

```
1 GPU (A100, Mistral-7B, vLLM):
  ~80 requests/sec с continuous batching
  При 10% gate rate и 5K msg/sec → 500 req/sec нужно
  → 7 GPU инстансов для 10K каналов в пике

Масштабирование:
  +GPU = +vLLM инстанс = +Pipeline Worker
  Ingest / Publisher — stateless, скейлятся тривиально
  Redis / PostgreSQL / Qdrant — не bottleneck при этой нагрузке
```

### Load balancing на vLLM

```
Pipeline Workers → round-robin или least-connections → [vLLM #1, vLLM #2, ..., vLLM #N]
```

Никакого специального routing. Nginx upstream или k8s Service.

---

## Backpressure — простой и правильный

```
Pipeline Worker публикует queue depth → Redis (каждую секунду)
Ingest Worker читает → снижает sampling rate пропорционально

При depth > 400: sampling * 0.7
При depth > 700: sampling * 0.4
При depth > 1000: sampling * 0.1 (только donations + subscribers)

Jitter ±20% на каждом инстансе → нет thundering herd
```

---

## Хранение данных — минимальный PostgreSQL

```sql
-- Всё в одной БД, без Neo4j

-- AiCard конфиг (существующее)
ai_cards (id, name, system_prompt, llm_model, max_memories, ...)

-- Активные каналы (обновляется Ingest Worker)
active_channels (channel_id, ai_card_id, last_active_at)

-- "Relations" которые были в Neo4j
channel_topics (channel_id, topic, weight, last_seen_at)
-- Запрос: SELECT topic FROM channel_topics WHERE channel_id = ? ORDER BY weight DESC LIMIT 5
-- Это не нужен Neo4j. Это один индекс.

-- Аналитика (async insert, не критический path)
message_events (id, channel_id, trace_id, tier, outcome, latency_ms, created_at)
```

---

## Observability — что реально важно

### Три главных метрики

```
1. synapse_e2e_latency_ms — от получения до голоса в эфире
   SLO: p95 < 4000ms

2. synapse_context_degraded_rate — % сообщений без истории или RAG
   Алерт: > 5% за 5 минут = что-то сломалось

3. synapse_gpu_queue_depth — очередь к vLLM
   Алерт: > 200 за 2 минуты = нужен ещё GPU
```

### Трейсинг — тот же W3C TraceContext

traceId рождается в Ingest, живёт до Publisher. Propagation через Redis Stream headers. Это оставляем из предыдущего дизайна — идея правильная.

---

## Deployment

```yaml
services:

  # Единственный сложный компонент — вся остальная система вокруг него
  vllm:
    image: vllm/vllm-openai:latest
    command: >
      --model mistralai/Mistral-7B-Instruct-v0.3
      --max-num-seqs 64
      --gpu-memory-utilization 0.90
      --enable-prefix-caching
    deploy:
      replicas: 2           # +1 replica = +GPU = +throughput. Вот и весь scaling plan.
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

  synapse-ingest:
    image: inktide/synapse-ingest:latest
    deploy:
      replicas: 3           # CPU-bound, stateless
      resources:
        limits: { cpus: "1", memory: 256M }

  synapse-pipeline:
    image: inktide/synapse-pipeline:latest
    deploy:
      replicas: 4           # I/O bound + GPU calls
      resources:
        limits: { cpus: "2", memory: 1G }

  synapse-publisher:
    image: inktide/synapse-publisher:latest
    deploy:
      replicas: 2
      resources:
        limits: { cpus: "1", memory: 256M }

  # Уже есть — ничего нового
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes

  postgres:
    image: postgres:16-alpine

  qdrant:
    image: qdrant/qdrant:v1.9.0

  # Observability
  prometheus:
    image: prom/prometheus:v2.51.0

  grafana:
    image: grafana/grafana:10.4.0
```

---

## Когда добавлять что

| Сигнал | Действие |
|--------|----------|
| GPU queue depth стабильно > 200 | Добавить vLLM инстанс + Pipeline Worker |
| Redis CPU > 60% | Redis Cluster или вынести rate limit в отдельный инстанс |
| Qdrant latency p99 > 50ms | Увеличить memory, добавить индекс |
| PostgreSQL slow queries | Добавить индекс, потом read replica, потом партиционирование |
| Нужен replay сообщений за дни | Тогда Kafka. Не раньше. |
| Нужны сложные graph traversals (3+ hop) | Тогда Neo4j. Не раньше. |
| > 5 разных типов pipeline у разных AiCards | Тогда config-driven DAG. Не раньше. |

---

## Сравнение с предыдущим дизайном

| Аспект | Предыдущий | Этот |
|--------|-----------|------|
| Компонентов | 11+ (Kafka, Neo4j, Consul, Schema Registry, ...) | 7 |
| Bottleneck решён? | Нет (GPU не в центре дизайна) | Да |
| Реальный latency выигрыш | Speculative execution: 15ms | Streaming TTS: ~800ms |
| Race conditions | 3 критических | 0 |
| SPOF | Outbox Relay (replicas: 1) | Нет |
| Операционная сложность | Высокая | Низкая |
| Масштабирование | Kafka rebalance, partition tuning | Добавить GPU |
