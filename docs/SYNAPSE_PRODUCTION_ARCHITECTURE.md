# Chimera Synapse — Production Architecture

> Engineering-grade design for 10K concurrent streamer channels.
> No vendor lock-in. Self-hosted stack. Every decision justified.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Full Technology Stack](#2-full-technology-stack)
3. [System Overview](#3-system-overview)
4. [Transport Layer — Kafka](#4-transport-layer--kafka)
5. [Layer 1 — Gate](#5-layer-1--gate)
6. [Layer 2 — Context Assembly](#6-layer-2--context-assembly)
7. [Layer 3 — LLM Pool](#7-layer-3--llm-pool)
8. [Config-Driven Pipeline (DAG)](#8-config-driven-pipeline-dag)
9. [Outbox Pattern — No Data Loss](#9-outbox-pattern--no-data-loss)
10. [Typed Pipeline Stages](#10-typed-pipeline-stages)
11. [Speculative Execution](#11-speculative-execution)
12. [Backpressure Propagation](#12-backpressure-propagation)
13. [Observability](#13-observability)
14. [Schema Evolution](#14-schema-evolution)
15. [Deployment](#15-deployment)
16. [What Was Fixed vs Previous Design](#16-what-was-fixed-vs-previous-design)

---

## 1. Design Principles

| Principle | Implementation |
|-----------|----------------|
| Each layer scales independently | Kafka partitions separate Gate / Context / LLM |
| No data loss | Transactional Outbox — no `_ = Task.Run()` |
| Channel affinity without custom routing | Kafka `partitionKey = channelId` |
| All external dependencies have circuit breaker | Polly per datasource |
| Observable by default | `traceId` born at Gate, lives through Response |
| Compile-time pipeline contracts | Typed `IPipelineStage<TIn, TOut>` |
| Resilient to partial failure | Graceful degradation with empty fallbacks |

---

## 2. Full Technology Stack

```
┌──────────────────────────────────────────────────────────────────┐
│  DATA PLANE                                                      │
│                                                                  │
│  Apache Kafka         — transport, replay, partition affinity    │
│  Redis 7              — L2 cache, token bucket, fair queue       │
│  vLLM                 — LLM serving with continuous batching     │
│  Qdrant               — vector embeddings / RAG                  │
│  Neo4j                — knowledge graph (relations, topics)      │
│  PostgreSQL           — AiCard config, pipeline DAG, outbox      │
│                                                                  │
│  CONTROL PLANE                                                   │
│                                                                  │
│  .NET 10 workers      — Gate, Context, LLM, Relay services      │
│  OpenTelemetry        — distributed tracing (W3C TraceContext)   │
│  Prometheus + Grafana — metrics, dashboards, alerts              │
│  Jaeger               — trace visualization                      │
│  Apache Avro          — schema registry for Kafka envelopes      │
│  Consul               — service discovery, health checks         │
│  Docker Swarm / k8s   — orchestration                            │
└──────────────────────────────────────────────────────────────────┘
```

### Why each choice

**Kafka over RabbitMQ:**
- `partitionKey = channelId` → natural channel affinity, no custom routing layer
- 24h message retention → replay on consumer crash, zero message loss
- Consumer group rebalancing → horizontal scaling without coordination
- Exactly-once semantics with transactions

**vLLM over raw Ollama:**
- Continuous batching: 10 requests in one GPU forward pass = 10x throughput
- PagedAttention: efficient KV cache, handles longer contexts
- Compatible with OpenAI API — no client code changes

**Redis Sorted Set over in-memory Queue:**
- Survives process restart
- Multiple LLM workers dequeue from one shared set
- Queue depth visible in metrics (`ZCARD`)
- Score encodes priority + timestamp in one value

**Counting Bloom Filter over standard Bloom Filter:**
- Supports `Remove()` — impossible in standard bloom filter
- Needed for channels that go offline during a stream

---

## 3. System Overview

```
Twitch / Discord
       │
       ▼
 Kafka: chat.input  ──────────────────────────── key: channelId
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1 — GATE  ×N instances                                    │
│  CountingBloomFilter (active channels, refreshed every 30s)      │
│  Redis Token Bucket per user (Lua, atomic)                       │
│  Stateless decision: Donation=100% / Sub=70% / Regular=10%       │
│  Zero I/O on rejection path                                      │
│  Output: GateEnvelope { message, priority, traceId, enqueuedAt } │
└──────────────────────────────────────────────────────────────────┘
       │ ~10% volume
       ▼
 Kafka: synapse.gate ────────────────────────── key: channelId
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 2 — CONTEXT ASSEMBLY  ×M instances                        │
│  L1→L2→L3 cache for AiCard (affinity → ~99% L1 hit)             │
│  Parallel fan-out: Redis history + Qdrant RAG + Neo4j graph      │
│  Circuit breaker per dependency                                   │
│  Timeout per datasource with empty fallback                      │
│  Config-driven DAG from PostgreSQL                               │
│  Output: ContextEnvelope { ...gate, aiCard, session, rag, graph }│
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
 Kafka: synapse.context ─────────────────────── key: channelId
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3 — LLM POOL  ×K instances (one per vLLM endpoint)        │
│  Redis SortedSet FairQueue (per-channel round-robin)             │
│  Priority override: donations → front                            │
│  Stale detection: drop if age > 15s                              │
│  Speculative execution: start LLM with partial context           │
│  vLLM: continuous batching across channels                       │
│  Outbox: session + memory writes (no fire-and-forget)            │
│  Output: LlmEnvelope { ...context, response, emotion }           │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
 Kafka: synapse.response ────────────────────── key: channelId
       │
       ▼
 Response Publisher → Twitch / Discord WebSocket
```

---

## 4. Transport Layer — Kafka

### Topic Topology

```
Exchange:  chimera.streaming (Kafka cluster, replication factor: 3)

Topic                  Partitions  Key          Retention  Consumers
─────────────────────  ──────────  ───────────  ─────────  ──────────────
chat.input             64          channelId    24h        Gate ×N
synapse.gate           64          channelId    1h         Context ×M
synapse.context        64          channelId    30min      LLM Pool ×K
synapse.response       64          channelId    6h         Response Publisher
synapse.outbox         16          entity_type  48h        Outbox Relay
```

### Why 64 partitions

```
Target: 10K channels, 5K msg/sec
After gate: ~500 msg/sec (10%)

64 partitions → ~8 channels per partition on average
Allows up to 64 parallel consumer instances per consumer group
Rebalancing headroom for scaling events
```

### Consumer configuration

```csharp
// Gate: high throughput, pure CPU
var gateConfig = new ConsumerConfig
{
    MaxPollRecords = 256,
    FetchMaxBytes = 52428800,   // 50MB
    EnableAutoCommit = false,   // manual commit after processing
};

// Context: medium throughput, parallel I/O bound
var contextConfig = new ConsumerConfig
{
    MaxPollRecords = 128,
    FetchMaxBytes = 10485760,
};

// LLM: low throughput, GPU bound — never over-fetch
var llmConfig = new ConsumerConfig
{
    MaxPollRecords = 16,        // don't pile up what you can't process
    FetchMaxBytes = 1048576,
};
```

### Partition affinity — how it works

```
channelId "twitch:stream123" → Kafka hash → partition 7
channelId "twitch:stream123" → always → partition 7
Partition 7 → always consumed by → Context Instance #2

Result: Instance #2 always processes stream123
        → L1 cache always hit for stream123's AiCard
        → no Redis/Postgres lookup after warm-up
```

---

## 5. Layer 1 — Gate

### Counting Bloom Filter

```csharp
/// <summary>
/// Unlike standard BloomFilter, counting variant supports Remove().
/// Standard BloomFilter.Remove() is mathematically impossible — counters fix this.
/// </summary>
public sealed class CountingBloomFilter
{
    private readonly int[] _counters;
    private readonly int _hashCount;
    private readonly int _size;

    public CountingBloomFilter(int expectedItems = 50_000, double falsePositiveRate = 0.01)
    {
        _size = OptimalSize(expectedItems, falsePositiveRate);
        _hashCount = OptimalHashCount(_size, expectedItems);
        _counters = new int[_size];
    }

    public void Add(string key)
    {
        foreach (var i in Hashes(key))
            Interlocked.Increment(ref _counters[i]);
    }

    public void Remove(string key)
    {
        foreach (var i in Hashes(key))
            Interlocked.Decrement(ref _counters[i]);
    }

    public bool MightContain(string key) =>
        Hashes(key).All(i => Volatile.Read(ref _counters[i]) > 0);

    // Refreshed from Redis every 30 seconds by a background HostedService
    public void Rebuild(IEnumerable<string> activeChannelIds)
    {
        Array.Clear(_counters);
        foreach (var id in activeChannelIds)
            Add(id);
    }

    private IEnumerable<int> Hashes(string key)
    {
        var h1 = MurmurHash3(key, 0);
        var h2 = MurmurHash3(key, h1);
        for (var i = 0; i < _hashCount; i++)
            yield return (int)(Math.Abs(h1 + (long)i * h2) % _size);
    }
}
```

### Redis Token Bucket — per-user rate limiting

```lua
-- Atomic Lua script — runs as a single Redis command (no race conditions)
-- KEYS[1] = "rate:{userId}"
-- ARGV[1] = capacity, ARGV[2] = refill_rate (tokens/sec), ARGV[3] = now (unix ms)

local key = KEYS[1]
local capacity    = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now         = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'last_ms')
local tokens    = tonumber(data[1]) or capacity
local last_ms   = tonumber(data[2]) or now

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
    private static readonly (int capacity, double rate)[] Tiers =
    {
        // capacity = burst, rate = sustained tokens/sec
        /* Donation     */ (200, 50.0),
        /* Broadcaster  */ (100, 20.0),
        /* Subscriber   */ (20,  2.0),
        /* Regular      */ (5,   0.5),
    };

    public async Task<bool> TryAcquireAsync(string userId, UserTier tier, CancellationToken ct)
    {
        var (capacity, rate) = Tiers[(int)tier];
        var result = await _redis.ScriptEvaluateAsync(
            _script,
            keys: [$"rate:{userId}"],
            values: [(RedisValue)capacity, (RedisValue)rate, (RedisValue)DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()]
        );
        return (int)result == 1;
    }
}
```

### Gate decision logic

```csharp
public sealed class GateStage : IPipelineStage<ChatMessage, GateEnvelope>
{
    public async Task<StageResult<GateEnvelope>> ExecuteAsync(ChatMessage msg, CancellationToken ct)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("gate");
        activity?.SetTag("channel.id", msg.ChannelId);

        // 1. Active channel check — zero DB I/O
        if (!_bloom.MightContain(msg.ChannelId))
            return StageResult<GateEnvelope>.Drop("channel_inactive");

        // 2. Per-user rate limiting — one Redis Lua call
        var tier = ResolveTier(msg.Sender);
        if (!await _tokenBucket.TryAcquireAsync(msg.Sender.UserId, tier, ct))
            return StageResult<GateEnvelope>.Drop("rate_limited");

        // 3. Probabilistic decision — pure math, no I/O
        var threshold = tier switch
        {
            UserTier.Donation    => 1.00,
            UserTier.Broadcaster => 1.00,
            UserTier.Subscriber  => 0.70,
            _                    => 0.10,
        };

        if (Random.Shared.NextDouble() >= threshold)
            return StageResult<GateEnvelope>.Drop("sampled_out");

        var priority = tier switch
        {
            UserTier.Donation    => 100,
            UserTier.Broadcaster => 90,
            UserTier.Subscriber  => 70,
            _                    => 10,
        };

        activity?.SetTag("gate.priority", priority);
        activity?.SetTag("gate.decision", "pass");

        return StageResult<GateEnvelope>.Ok(new GateEnvelope(
            Message:    msg,
            Priority:   priority,
            TraceId:    activity?.Id ?? Guid.NewGuid().ToString(),
            EnqueuedAt: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        ));
    }
}
```

---

## 6. Layer 2 — Context Assembly

### Three-tier AiCard cache

```
L1: ConcurrentDictionary<string, AiCardContext>   process memory
    TTL: 5 minutes, evicted by MemoryCache pressure
    Hit rate: ~99% for live channels (Kafka affinity guarantees this)

L2: Redis HGET "ctx:channel:{channelId}"
    TTL: 5 minutes
    Hit rate: ~99.9% on L1 miss (cold start only)

L3: PostgreSQL JOIN (ai_card_channels → ai_cards → llm_catalog)
    Hit rate: < 0.1% — rarely reached
    On L3 hit: populate L2 and L1
```

### Parallel fan-out with circuit breaker

```csharp
public sealed class ContextStage : IPipelineStage<GateEnvelope, ContextEnvelope>
{
    private readonly ICircuitBreaker _qdrantCb;
    private readonly ICircuitBreaker _neo4jCb;

    public async Task<StageResult<ContextEnvelope>> ExecuteAsync(GateEnvelope input, CancellationToken ct)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("context.assemble");

        // Resolve AiCard: L1 → L2 → L3
        var aiCard = await _contextResolver.ResolveAsync(input.Message.ChannelId, ct);
        if (aiCard is null)
        {
            _bloom.Remove(input.Message.ChannelId); // evict from bloom filter
            return StageResult<ContextEnvelope>.Drop("no_aicard");
        }

        // All three fire simultaneously — total latency = max(all three)
        var historyTask = _session
            .GetHistoryAsync(aiCard.AiCardId, input.Message.ChannelId, ct)
            .WithTimeout(TimeSpan.FromMilliseconds(10), SessionContext.Empty);

        var ragTask = _qdrantCb.ExecuteAsync(
            execute:  () => _rag.QueryAsync(aiCard.AiCardId, input.Message.Text, aiCard.MaxMemories, ct),
            fallback: RagContext.Empty,
            timeout:  TimeSpan.FromMilliseconds(15));

        var graphTask = _neo4jCb.ExecuteAsync(
            execute:  () => _graph.GetRelationsAsync(input.Message.ChannelId, ct),
            fallback: GraphContext.Empty,
            timeout:  TimeSpan.FromMilliseconds(20));

        var (session, rag, graph) = await (historyTask, ragTask, graphTask).WhenAll();

        activity?.SetTag("context.rag_memories", rag.Memories.Count);
        activity?.SetTag("context.history_turns", session.History.Count);
        activity?.SetTag("context.graph_nodes", graph.Nodes.Count);
        activity?.SetTag("context.rag_degraded", rag == RagContext.Empty);
        activity?.SetTag("context.graph_degraded", graph == GraphContext.Empty);

        return StageResult<ContextEnvelope>.Ok(new ContextEnvelope(input, aiCard, session, rag, graph));
    }
}
```

### Backpressure signal from Context → Gate

```csharp
// Context worker exposes current queue depth via Redis
// Gate reads it and adjusts sampling rates dynamically

public sealed class AdaptiveGateSampler
{
    public async Task<double> GetThresholdAsync(UserTier tier, CancellationToken ct)
    {
        var depth = (long)await _redis.StringGetAsync("synapse:context:queue_depth");

        // Linear backpressure: at depth=500 → reduce to 50%, at depth=1000 → 10%
        var loadFactor = Math.Clamp(1.0 - depth / 1000.0, 0.1, 1.0);

        return tier switch
        {
            UserTier.Donation    => 1.00,               // donations never drop
            UserTier.Broadcaster => 1.00,               // broadcasters never drop
            UserTier.Subscriber  => 0.70 * loadFactor,
            _                    => 0.10 * loadFactor,
        };
    }
}
```

---

## 7. Layer 3 — LLM Pool

### Distributed Fair Queue in Redis

```csharp
/// <summary>
/// Per-channel fair scheduling using Redis Sorted Set.
/// Score = priority * 1e12 - enqueued_at → high priority + older = processed first.
/// Survives process restart. Multiple LLM workers dequeue from same set.
/// </summary>
public sealed class RedisFairQueue
{
    private const string QueueKey  = "synapse:llm:fair-queue";
    private const string PayloadNs = "synapse:llm:msg:";

    public async Task EnqueueAsync(ContextEnvelope envelope, CancellationToken ct)
    {
        var member  = $"{envelope.Gate.Message.ChannelId}:{envelope.Gate.TraceId}";
        var score   = envelope.Gate.Priority * 1_000_000_000_000L - envelope.Gate.EnqueuedAt;
        var payload = Serialize(envelope);

        var batch = _redis.CreateBatch();
        _ = batch.SortedSetAddAsync(QueueKey, member, score);
        _ = batch.StringSetAsync($"{PayloadNs}{envelope.Gate.TraceId}", payload, TimeSpan.FromSeconds(30));
        batch.Execute();

        await _redis.PublishAsync("synapse:llm:notify", "1"); // wake sleeping consumers
    }

    public async Task<ContextEnvelope?> TryDequeueAsync(CancellationToken ct)
    {
        // Atomic pop — no two workers get the same message
        var entry = await _redis.SortedSetPopAsync(QueueKey, Order.Descending);
        if (!entry.HasValue) return null;

        var traceId = ExtractTraceId(entry.Value.Element.ToString());
        var payload = await _redis.StringGetDeleteAsync($"{PayloadNs}{traceId}");

        return payload.HasValue ? Deserialize(payload!) : null;
    }
}

// LLM consumer loop
public sealed class LlmWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var _ in _subscriber.ReadAsync("synapse:llm:notify", ct))
        {
            while (await _queue.TryDequeueAsync(ct) is { } envelope)
            {
                // Stale detection — LLM takes 3-8s, message older than 15s is worthless
                if (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - envelope.Gate.EnqueuedAt > 15_000)
                {
                    _metrics.LlmRequestsDropped.Inc(new[] { "stale" });
                    continue;
                }

                await ProcessAsync(envelope, ct);
            }
        }
    }
}
```

### vLLM continuous batching

```
Without batching (Ollama default):
  T=0:  req_A starts  ───────────────────────── 8s ──► done
  T=0:  req_B waits   ────────────────────────────────── 8s ──► done
  T=0:  req_C waits   ─────────────────────────────────────────── 8s ──► done
  Total: 24s sequential

With vLLM continuous batching:
  T=0:  req_A + req_B + req_C → single GPU forward pass
  T=0:  ─────────────────── 8s ──► all three done
  Total: 8s (3x throughput, same GPU)
```

```yaml
# vLLM server — drop-in replacement for Ollama, OpenAI-compatible API
services:
  vllm:
    image: vllm/vllm-openai:latest
    command: >
      --model mistralai/Mistral-7B-Instruct-v0.3
      --max-model-len 8192
      --max-num-seqs 64          # max concurrent requests in batch
      --gpu-memory-utilization 0.90
      --enable-prefix-caching    # KV cache reuse for same system prompts
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
```

---

## 8. Config-Driven Pipeline (DAG)

### Why flat table is wrong

`parallel_group INT` cannot express:
- Conditional edges (if Qdrant fails → use fallback step)
- DAGs where step B depends on both A1 and A2
- Per-step retry policies

### PostgreSQL schema — pipeline as DAG

```sql
CREATE TABLE pipeline_definitions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_card_id  UUID NOT NULL REFERENCES soul.ai_cards(id),
    version     INT NOT NULL DEFAULT 1,
    is_active   BOOL NOT NULL DEFAULT true,
    graph       JSONB NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (ai_card_id, version)
);

CREATE INDEX idx_pipeline_ai_card_active
    ON pipeline_definitions (ai_card_id, is_active)
    WHERE is_active = true;
```

### Pipeline graph format

```json
{
  "nodes": [
    {
      "id": "history",
      "type": "redis_history",
      "timeout_ms": 10,
      "required": false,
      "fallback": "empty"
    },
    {
      "id": "rag",
      "type": "qdrant_rag",
      "timeout_ms": 15,
      "required": false,
      "fallback": "empty",
      "config": { "max_memories": 5 }
    },
    {
      "id": "graph",
      "type": "neo4j_graph",
      "timeout_ms": 20,
      "required": false,
      "fallback": "empty"
    },
    {
      "id": "llm",
      "type": "llm_inference",
      "timeout_ms": 8000,
      "required": true,
      "config": { "speculative": true }
    }
  ],
  "parallel_groups": [
    ["history", "rag", "graph"]
  ],
  "edges": [
    { "from": "history", "to": "llm" },
    { "from": "rag",     "to": "llm" },
    { "from": "graph",   "to": "llm" }
  ]
}
```

### DAG builder

```csharp
public sealed class DagPipelineBuilder
{
    public async Task<ICompiledPipeline> BuildAsync(Guid aiCardId, CancellationToken ct)
    {
        // L1 cache hit ~99% — pipelines rarely change
        if (_cache.TryGetValue($"pipeline:{aiCardId}", out ICompiledPipeline? cached))
            return cached!;

        var definition = await _db.PipelineDefinitions
            .AsNoTracking()
            .Where(p => p.AiCardId == aiCardId && p.IsActive)
            .OrderByDescending(p => p.Version)
            .FirstOrDefaultAsync(ct)
            ?? PipelineDefinition.Default;  // fallback to standard pipeline

        var graph = JsonSerializer.Deserialize<PipelineGraph>(definition.Graph)!;
        var pipeline = Compile(graph);

        _cache.Set($"pipeline:{aiCardId}", pipeline, TimeSpan.FromMinutes(5));
        return pipeline;
    }

    private ICompiledPipeline Compile(PipelineGraph graph)
    {
        var builder = new PipelineType<ContextEnvelope>();

        // Topological sort → determine execution order
        foreach (var group in TopologicalGroups(graph))
        {
            if (group.Count == 1)
                builder.AddStep(ResolveStep(group[0]));
            else
                builder.AddParallelSteps(group.Select(ResolveStep).ToArray());
        }

        return builder;
    }
}
```

---

## 9. Outbox Pattern — No Data Loss

### The problem with fire-and-forget

```csharp
// WRONG — current code
_ = SaveSessionAsync(...);         // process crashes → turn lost forever
_ = _memoryIngestion.EnqueueAsync(); // no guarantee of delivery
```

### Transactional Outbox

```sql
CREATE TABLE outbox_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic       TEXT NOT NULL,       -- 'session.turn' | 'memory.ingest'
    payload     JSONB NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    sent_at     TIMESTAMPTZ,         -- NULL = not yet delivered
    attempts    INT NOT NULL DEFAULT 0,
    last_error  TEXT
);

CREATE INDEX idx_outbox_unsent ON outbox_events (created_at) WHERE sent_at IS NULL;
```

```csharp
// In LlmStage — single transaction, both business data and outbox events
public async Task<StageResult<LlmEnvelope>> ExecuteAsync(ContextEnvelope input, CancellationToken ct)
{
    var response = await _vllm.CompleteAsync(BuildPrompt(input), ct);

    await using var tx = await _db.Database.BeginTransactionAsync(ct);

    _db.OutboxEvents.AddRange(
        new OutboxEvent
        {
            Topic   = "session.turn",
            Payload = JsonSerializer.SerializeToDocument(new SessionTurnEvent(
                AiCardId:  input.AiCard.AiCardId,
                ChannelId: input.Gate.Message.ChannelId,
                UserTurn:  new SessionTurn("user",      input.Gate.Message.Text,  input.Gate.Message.Sender.UserName),
                BotTurn:   new SessionTurn("assistant", response.CleanText, "bot")
            ))
        },
        new OutboxEvent
        {
            Topic   = "memory.ingest",
            Payload = JsonSerializer.SerializeToDocument(new MemoryIngestionJob(
                AiCardId:    input.AiCard.AiCardId,
                ChannelId:   input.Gate.Message.ChannelId,
                UserMessage: input.Gate.Message.Text,
                BotResponse: response.CleanText
            ))
        }
    );

    await _db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);

    // Outbox Relay reads outbox_events and publishes to Kafka — separately, reliably
    return StageResult<LlmEnvelope>.Ok(new LlmEnvelope(input, response));
}
```

### Outbox Relay — separate HostedService

```csharp
/// <summary>
/// Polls outbox_events every 100ms and publishes to Kafka.
/// At-least-once delivery. Idempotent consumers handle duplicates.
/// </summary>
public sealed class OutboxRelay : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var events = await _db.OutboxEvents
                .Where(e => e.SentAt == null && e.Attempts < 5)
                .OrderBy(e => e.CreatedAt)
                .Take(100)
                .ToListAsync(ct);

            foreach (var evt in events)
            {
                try
                {
                    await _kafka.ProduceAsync(evt.Topic, evt.Payload.RootElement.ToString(), ct);
                    evt.SentAt = DateTimeOffset.UtcNow;
                }
                catch (Exception ex)
                {
                    evt.Attempts++;
                    evt.LastError = ex.Message;
                }
            }

            await _db.SaveChangesAsync(ct);
            await Task.Delay(100, ct);
        }
    }
}
```

---

## 10. Typed Pipeline Stages

### The problem with property bag

```csharp
// WRONG — current MessageProcessingContext
private readonly ConcurrentDictionary<Type, object> _data = new();
public void Set<T>(T value) ...
public T? Get<T>() ...

// If RagStep forgot to call Set<RagContext>(), LlmStep gets null silently.
// No compile-time error. No contract between stages.
```

### Typed stage contract

```csharp
/// <summary>
/// Each stage has an explicit input and output type.
/// Missing context = compile error, not runtime null.
/// </summary>
public interface IPipelineStage<TIn, TOut>
{
    Task<StageResult<TOut>> ExecuteAsync(TIn input, CancellationToken ct);
}

public sealed record StageResult<T>
{
    public T?          Value      { get; init; }
    public StageStatus Status     { get; init; }
    public string?     DropReason { get; init; }

    public static StageResult<T> Ok(T value)           => new() { Value = value, Status = StageStatus.Ok };
    public static StageResult<T> Drop(string reason)   => new() { Status = StageStatus.Dropped, DropReason = reason };
}

// Typed envelopes — each stage adds its own data
public sealed record GateEnvelope(
    ChatMessage Message,
    int         Priority,
    string      TraceId,
    long        EnqueuedAt);

public sealed record ContextEnvelope(
    GateEnvelope   Gate,
    AiCardContext  AiCard,
    SessionContext Session,
    RagContext     Rag,
    GraphContext   Graph);

public sealed record LlmEnvelope(
    ContextEnvelope Context,
    LlmResponse     Response);

// Stages: compile-time verified chain
// GateStage:    ChatMessage    → GateEnvelope
// ContextStage: GateEnvelope   → ContextEnvelope
// LlmStage:     ContextEnvelope → LlmEnvelope
```

---

## 11. Speculative Execution

### The concept

Standard flow: wait for ALL context → then start LLM.
Speculative: start LLM immediately, use tool calls to fetch context on-demand.

### Implementation with Tool Calls (Mistral / Llama 3.1+)

```csharp
public sealed class SpeculativeLlmStage : IPipelineStage<ContextEnvelope, LlmEnvelope>
{
    public async Task<StageResult<LlmEnvelope>> ExecuteAsync(ContextEnvelope input, CancellationToken ct)
    {
        // Base context is always available (from L1 cache: AiCard, system prompt)
        // Qdrant / Neo4j results might be empty (degraded) or populated (normal)

        var tools = new[]
        {
            new Tool("search_memory",
                description: "Search for relevant memories about this user or topic",
                parameters: new { query = "string", max_results = "int" }),

            new Tool("get_channel_context",
                description: "Get recent activity and relations for this channel",
                parameters: new { channel_id = "string" }),
        };

        // LLM decides when and if to call tools — only if context is missing
        var request = new ChatRequest
        {
            Model    = input.AiCard.LlmModel,
            Messages = BuildBasePrompt(input),
            Tools    = input.AiCard.SpeculativeEnabled ? tools : null,
            Stream   = false,
        };

        var response = await _vllm.CompleteAsync(request, ct);

        // Handle tool calls — LLM requested missing context
        while (response.ToolCalls?.Count > 0)
        {
            var toolResults = await ExecuteToolCallsAsync(response.ToolCalls, ct);

            // Append tool results and continue generation
            request = request with
            {
                Messages = request.Messages
                    .Append(response.AsAssistantMessage())
                    .Concat(toolResults.Select(r => r.AsToolMessage()))
                    .ToList()
            };

            response = await _vllm.CompleteAsync(request, ct);
        }

        return StageResult<LlmEnvelope>.Ok(new LlmEnvelope(input, ParseResponse(response)));
    }

    private async Task<IReadOnlyList<ToolResult>> ExecuteToolCallsAsync(
        IReadOnlyList<ToolCall> calls, CancellationToken ct)
    {
        // Tool calls run in parallel
        var tasks = calls.Select(call => call.Name switch
        {
            "search_memory"      => ExecuteRagToolAsync(call, ct),
            "get_channel_context" => ExecuteGraphToolAsync(call, ct),
            _                    => Task.FromResult(ToolResult.Empty(call.Id))
        });

        return await Task.WhenAll(tasks);
    }
}
```

### Latency comparison

```
Standard flow:
  T=0ms:   Qdrant query starts
  T=5ms:   Qdrant returns 5 memories
  T=5ms:   Neo4j query starts
  T=15ms:  Neo4j returns graph
  T=15ms:  LLM starts with full context
  T=7000ms: Response ready

Speculative (LLM doesn't need context for this message):
  T=0ms:   LLM starts (base prompt only)
  T=6000ms: LLM done — no tool calls needed
  T=6000ms: Response ready  ← 14% faster, no wasted I/O

Speculative (LLM needs context):
  T=0ms:   LLM starts (base prompt)
  T=800ms: LLM emits tool call: search_memory("gaming setup")
  T=810ms: Qdrant query starts
  T=815ms: Qdrant returns → LLM continues
  T=7000ms: Response ready  ← same latency, but I/O only when needed
```

---

## 12. Backpressure Propagation

```
Problem: LLM pool saturated → Context layer keeps producing → Kafka topic fills up
         → messages pile up → when LLM recovers, 90% are stale → wasted work
```

### Three-level backpressure

```csharp
// LLM Worker publishes queue depth to Redis every second
public sealed class LlmQueueMonitor : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var depth = await _redis.SortedSetLengthAsync("synapse:llm:fair-queue");
            await _redis.StringSetAsync("synapse:llm:queue_depth", depth, TimeSpan.FromSeconds(10));

            // Metrics for Grafana alert
            _metrics.LlmQueueDepth.Set(depth);

            await Task.Delay(1000, ct);
        }
    }
}

// Context Worker reads depth and adjusts .NET Channel bounded capacity
public sealed class ContextWorkerHost : BackgroundService
{
    private readonly Channel<GateEnvelope> _inbound = Channel.CreateBounded<GateEnvelope>(
        new BoundedChannelOptions(2000)
        {
            FullMode      = BoundedChannelFullMode.DropOldest, // real-time: stale = worthless
            SingleReader  = false,
            SingleWriter  = false,
        });

    // If LLM queue depth > 800 → pause consuming from Kafka
    // Kafka consumer group lag grows → Kafka applies backpressure naturally
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var llmDepth = (long)await _redis.StringGetAsync("synapse:llm:queue_depth");

            if (llmDepth > 800)
            {
                _logger.LogWarning("LLM queue saturated ({Depth}), pausing context consumption", llmDepth);
                await Task.Delay(500, ct);  // yield — let LLM drain
                continue;
            }

            // Normal operation: consume from Kafka → process → publish to synapse.context
            await ConsumeAndProcessAsync(ct);
        }
    }
}

// Gate reads Context queue depth and reduces sampling
// → already shown in AdaptiveGateSampler above
```

---

## 13. Observability

### OpenTelemetry — trace through all layers

```csharp
// Single ActivitySource for the whole Synapse module
public static class Telemetry
{
    public static readonly ActivitySource ActivitySource = new("Chimera.Synapse", "1.0.0");
}

// traceId born in Gate, propagated via Kafka header
// Every log line includes traceId → correlate logs across services

// In Kafka producer:
await _producer.ProduceAsync(topic, new Message<string, byte[]>
{
    Key   = channelId,
    Value = Serialize(envelope),
    Headers = new Headers
    {
        { "traceparent", Encoding.UTF8.GetBytes(Activity.Current?.Id ?? "") },
        { "tracestate",  Encoding.UTF8.GetBytes(Activity.Current?.TraceStateString ?? "") },
    }
});

// In Kafka consumer:
var traceparent = message.Headers.TryGetLastBytes("traceparent", out var bytes)
    ? Encoding.UTF8.GetString(bytes) : null;

using var activity = Telemetry.ActivitySource.StartActivity(
    "context.assemble",
    ActivityKind.Consumer,
    parentContext: traceparent is not null
        ? ActivityContext.Parse(traceparent, null)
        : default);
```

### Required Prometheus metrics

```csharp
public static class SynapseMetrics
{
    // Gate
    public static readonly Counter MessagesReceived =
        Metrics.CreateCounter("synapse_gate_received_total", "Messages received by gate",
            labelNames: ["channel_type"]);

    public static readonly Counter MessagesDropped =
        Metrics.CreateCounter("synapse_gate_dropped_total", "Messages dropped at gate",
            labelNames: ["reason"]);    // channel_inactive | rate_limited | sampled_out | stale

    public static readonly Histogram GateLatency =
        Metrics.CreateHistogram("synapse_gate_duration_ms", "Gate processing latency");

    // Context
    public static readonly Histogram ContextLatency =
        Metrics.CreateHistogram("synapse_context_duration_ms", "Context assembly latency",
            labelNames: ["rag_degraded", "graph_degraded"]);

    public static readonly Counter CacheHits =
        Metrics.CreateCounter("synapse_cache_hits_total", "AiCard cache hits",
            labelNames: ["tier"]);      // l1 | l2 | l3

    // LLM
    public static readonly Gauge LlmQueueDepth =
        Metrics.CreateGauge("synapse_llm_queue_depth", "LLM fair queue depth",
            labelNames: ["priority_tier"]);

    public static readonly Histogram LlmLatency =
        Metrics.CreateHistogram("synapse_llm_duration_ms", "LLM inference latency",
            labelNames: ["model", "speculative"]);

    public static readonly Counter LlmRequestsDropped =
        Metrics.CreateCounter("synapse_llm_dropped_total", "LLM requests dropped",
            labelNames: ["reason"]);    // stale | circuit_open

    // Outbox
    public static readonly Gauge OutboxPendingEvents =
        Metrics.CreateGauge("synapse_outbox_pending", "Outbox events not yet delivered");
}
```

### Grafana alerts (critical)

```yaml
# SLO: 95% of messages processed end-to-end in < 10 seconds
- alert: SynapseSloViolation
  expr: histogram_quantile(0.95, synapse_e2e_duration_ms) > 10000
  for: 2m
  labels: { severity: critical }

# Gate drop rate > 30% of non-sampled traffic = something wrong upstream
- alert: SynapseHighDropRate
  expr: rate(synapse_gate_dropped_total{reason!="sampled_out"}[5m]) /
        rate(synapse_gate_received_total[5m]) > 0.30
  for: 1m
  labels: { severity: warning }

# Outbox backlog > 1000 = Relay is falling behind
- alert: SynapseOutboxBacklog
  expr: synapse_outbox_pending > 1000
  for: 3m
  labels: { severity: warning }

# LLM queue depth > 500 = approaching saturation
- alert: SynapseLlmQueueSaturation
  expr: synapse_llm_queue_depth > 500
  for: 2m
  labels: { severity: warning }
```

---

## 14. Schema Evolution

### Problem

If `ContextEnvelope` changes while messages are in-flight in `synapse.context` topic, old messages deserialized by new consumers → crash or silent data corruption.

### Solution: Apache Avro + Schema Registry

```csharp
// Every Kafka message carries schema version in header
// Consumers check schema before deserializing

public sealed class VersionedKafkaSerializer<T>
{
    public byte[] Serialize(T value, int schemaVersion)
    {
        using var ms = new MemoryStream();
        ms.WriteByte(0);                                    // magic byte
        ms.Write(BitConverter.GetBytes(schemaVersion));    // 4-byte schema id
        _avroSerializer.Serialize(ms, value);
        return ms.ToArray();
    }

    public T Deserialize(byte[] data)
    {
        using var ms = new MemoryStream(data);
        ms.ReadByte();                                      // skip magic byte
        var schemaId = BitConverter.ToInt32(ms.Read(4));   // read schema id
        var schema   = _schemaRegistry.GetById(schemaId);  // fetch schema
        return _avroDeserializer.Deserialize(ms, schema);  // use correct schema
    }
}
```

### Compatibility rules

```
BACKWARD compatible  → new schema can read old messages   → safe to deploy consumers first
FORWARD  compatible  → old schema can read new messages   → safe to deploy producers first
FULL     compatible  → both directions                    → safest, required for Synapse
```

---

## 15. Deployment

```yaml
# docker-compose.production.yml

services:

  # ─── KAFKA ────────────────────────────────────────────────────────────────
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_NUM_PARTITIONS: 64
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_LOG_RETENTION_HOURS: 24
    deploy:
      replicas: 3

  schema-registry:
    image: confluentinc/cp-schema-registry:7.6.0
    depends_on: [kafka]

  # ─── GATE ─────────────────────────────────────────────────────────────────
  synapse-gate:
    image: chimera/synapse-gate:latest
    environment:
      KAFKA__BOOTSTRAP_SERVERS: kafka:9092
      KAFKA__INPUT_TOPIC:  chat.input
      KAFKA__OUTPUT_TOPIC: synapse.gate
      KAFKA__MAX_POLL_RECORDS: 256
      BLOOM_FILTER__REFRESH_INTERVAL_SECONDS: 30
    deploy:
      replicas: 4
      resources:
        limits: { cpus: "2", memory: 512M }

  # ─── CONTEXT ──────────────────────────────────────────────────────────────
  synapse-context:
    image: chimera/synapse-context:latest
    environment:
      KAFKA__INPUT_TOPIC:  synapse.gate
      KAFKA__OUTPUT_TOPIC: synapse.context
      KAFKA__MAX_POLL_RECORDS: 128
      CONTEXT__HISTORY_TIMEOUT_MS: 10
      CONTEXT__QDRANT_TIMEOUT_MS:  15
      CONTEXT__NEO4J_TIMEOUT_MS:   20
    deploy:
      replicas: 4
      resources:
        limits: { cpus: "4", memory: 2G }

  # ─── vLLM ─────────────────────────────────────────────────────────────────
  vllm:
    image: vllm/vllm-openai:latest
    command: >
      --model mistralai/Mistral-7B-Instruct-v0.3
      --max-num-seqs 64
      --gpu-memory-utilization 0.90
      --enable-prefix-caching
      --port 8000
    deploy:
      replicas: 2
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

  # ─── LLM POOL ─────────────────────────────────────────────────────────────
  synapse-llm:
    image: chimera/synapse-llm:latest
    environment:
      KAFKA__INPUT_TOPIC:   synapse.context
      KAFKA__OUTPUT_TOPIC:  synapse.response
      KAFKA__MAX_POLL_RECORDS: 16
      LLM__VLLM_ENDPOINT:   http://vllm:8000/v1
      LLM__STALE_TIMEOUT_MS: 15000
    deploy:
      replicas: 2    # one per vLLM instance
      resources:
        limits: { cpus: "2", memory: 1G }

  # ─── OUTBOX RELAY ─────────────────────────────────────────────────────────
  synapse-outbox-relay:
    image: chimera/synapse-outbox-relay:latest
    environment:
      OUTBOX__POLL_INTERVAL_MS: 100
      OUTBOX__BATCH_SIZE: 100
      OUTBOX__MAX_ATTEMPTS: 5
    deploy:
      replicas: 1    # single relay per DB to avoid duplicate delivery races

  # ─── OBSERVABILITY ────────────────────────────────────────────────────────
  jaeger:
    image: jaegertracing/all-in-one:1.56

  prometheus:
    image: prom/prometheus:v2.51.0

  grafana:
    image: grafana/grafana:10.4.0

  # ─── EXISTING SERVICES ────────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    command: redis-server --save 60 1 --appendonly yes   # AOF for durability

  qdrant:
    image: qdrant/qdrant:v1.9.0

  neo4j:
    image: neo4j:5.19
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
```

---

## 16. What Was Fixed vs Previous Design

| Previous Issue | Severity | Fix Applied |
|----------------|----------|-------------|
| `BloomFilter.Remove()` — mathematically impossible | Critical | Counting Bloom Filter |
| `_ = Task.Run()` — data loss on crash | Critical | Transactional Outbox |
| FairQueue in process memory — not scalable | High | Redis Sorted Set |
| RabbitMQ — no replay, no affinity | High | Kafka with channelId partition key |
| Channel affinity needed custom routing | High | Kafka partition = affinity, free |
| `Random.NextDouble()` — no per-user burst control | Medium | Redis Token Bucket (Lua, atomic) |
| Property bag context — no compile-time contract | Medium | Typed `IPipelineStage<TIn, TOut>` |
| Flat `parallel_group` — can't express DAG | Medium | JSON DAG in PostgreSQL |
| "Event Sourcing" — mislabeled, wrong pattern | Medium | Choreography Saga via Kafka |
| No batching for LLM | High | vLLM continuous batching |
| No backpressure propagation | High | Redis depth signal → adaptive gate |
| No distributed tracing | Medium | OpenTelemetry W3C TraceContext |
| No schema evolution strategy | Medium | Avro + Schema Registry |
| Ollama single-request | High | vLLM with PagedAttention |
| In-process pipeline only | Medium | DAG compiled from PostgreSQL config |
