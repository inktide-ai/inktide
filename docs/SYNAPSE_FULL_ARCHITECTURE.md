# Synapse — полная архитектура (Rethink + Ideal)

Сводная визуализация по [`SYNAPSE_ARCHITECTURE_RETHINK.md`](./SYNAPSE_ARCHITECTURE_RETHINK.md) и [`SYNAPSE_IDEAL_ARCHITECTURE.md`](./SYNAPSE_IDEAL_ARCHITECTURE.md). Диаграммы в Mermaid — рендерятся в GitHub, VS Code, многих IDE.

---

## 1. Контекст и latency budget

```mermaid
flowchart LR
  subgraph budget["Latency budget < 4000 ms (голос в эфире)"]
    A["0–50 ms<br/>Ingest"]
    B["50–200 ms<br/>Контекст"]
    C["200–3000 ms<br/>vLLM GPU"]
    D["параллельно хвосту LLM<br/>TTS первые слова"]
  end
  A --> B --> C
  C -.-> D
```

---

## 2. Сквозной поток (платформы → голос)

```mermaid
flowchart TB
  subgraph sources["Источники"]
    TW["Twitch"]
    DC["Discord"]
  end

  subgraph ingest["INGEST WORKER ×N — stateless, CPU"]
    I1["SISMEMBER активный канал"]
    I2["Token bucket rate limit"]
    I3["Backpressure: synapse:pipeline:depth"]
    I4["Sampling tier × loadFactor × jitter"]
    I5["XADD synapse.ingest + traceId"]
  end

  subgraph redis["Redis 7"]
    RS["Stream synapse.ingest<br/>CG: pipeline-workers"]
    RRESP["Stream synapse.response<br/>CG: publisher-workers"]
    RSET["SET synapse:active_channels"]
    RHIST["История диалога"]
    RDEPTH["STRING synapse:pipeline:depth<br/>INCR/DECR"]
    RCTX["HASH ctx:channel:{id}<br/>L2 AiCard"]
  end

  subgraph pipeline["PIPELINE WORKER ×M — I/O + GPU"]
    P0["XREADGROUP / XAUTOCLAIM"]
    P1["Stale > 10s → drop"]
    P2["INCR depth на входе"]
    subgraph ctx["Контекст ≤150 ms параллельно"]
      C1["Redis history → fallback"]
      C2["Qdrant RAG → fallback"]
      C3["AiCard L1→L2→L3"]
    end
    P3["vLLM streaming"]
    P4["На границе предложения → TTS async"]
    P5["DECR depth на выходе"]
    P6["Async: AppendHistory + memory ingest"]
    P7["XADD synapse.response"]
  end

  subgraph data["Данные"]
    PG[("PostgreSQL<br/>AiCards, active_channels,<br/>channel_topics, message_events")]
    QD[("Qdrant<br/>RAG vectors")]
  end

  subgraph serving["SERVING"]
    VLLM["vLLM × replicas<br/>round-robin / least-conn"]
    TTS["Kokoro TTS"]
  end

  subgraph pub["PUBLISHER WORKER ×K"]
    PW["WS → Twitch / Discord"]
  end

  TW --> ingest
  DC --> ingest
  I1 --> I2 --> I3 --> I4 --> I5
  I5 --> RS
  RSET -.-> I1
  RDEPTH -.-> I3

  RS --> P0
  P0 --> P1 --> P2 --> ctx
  C1 --> RHIST
  C2 --> QD
  C3 --> RCTX
  C3 --> PG
  ctx --> P3
  P3 --> VLLM
  P3 --> P4
  P4 --> TTS
  P2 --> RDEPTH
  P5 --> RDEPTH
  P6 --> RHIST
  P6 --> QD
  P6 --> PG
  P7 --> RRESP
  TTS --> P7
  RRESP --> PW
  PW --> TW
  PW --> DC
```

> В Rethink-документе очередь также обозначена как `synapse.pipeline` / `chat.input`; в Ideal зафиксированы имена **`synapse.ingest`** и **`synapse.response`** — на схеме используются они.

---

## 3. Топология Redis Streams (Ideal)

```mermaid
flowchart LR
  subgraph streams["Streams"]
    S1["synapse.ingest<br/>key: channelId<br/>MAXLEN ~50k<br/>→ pipeline-workers"]
    S2["synapse.response<br/>key: channelId<br/>MAXLEN ~10k<br/>→ publisher-workers"]
  end
  S1 --> S2
```

---

## 4. Внутри Pipeline: этапы и типизированный контракт (Ideal)

```mermaid
flowchart LR
  M["ChatMessage"] --> S1["IPipelineStage<br/>IngestEnvelope"]
  S1 --> S2["IPipelineStage<br/>ContextEnvelope"]
  S2 --> S3["IPipelineStage<br/>LlmEnvelope"]
  S3 --> OUT["Publisher input"]

  subgraph stages["StageResult T — Ok / Drop reason"]
    D1["drop: inactive, rate, sampled"]
    D2["drop: no_aicard"]
    D3["drop: stale"]
  end
```

---

## 5. Streaming TTS vs «сначала весь LLM»

```mermaid
flowchart TB
  subgraph bad["Без overlap: хуже по latency"]
    b1["Context"] --> b2["LLM полный ответ ~2800ms"] --> b3["TTS ~800ms"]
  end
  subgraph good["Streaming TTS — ключевая оптимизация"]
    g1["Context ~150ms"] --> g2["LLM стримит"]
    g2 --> g3["Первое предложение ~500ms → сразу TTS"]
    g2 --> g4["Хвост LLM параллельно с TTS"]
  end
```

---

## 6. Backpressure (Ideal)

```mermaid
flowchart TB
  PW["Pipeline Worker"] -->|INCR на старт| D["synapse:pipeline:depth"]
  PW -->|DECR на завершение| D
  D --> IW["Ingest Worker"]
  IW -->|loadFactor в sampling| SAM["Subscriber / Regular sampling"]
```

| depth | Поведение (упрощённо) |
|-------|------------------------|
| &lt; 200 | норма |
| 200–400 | loadFactor ~0.7 |
| 400–700 | loadFactor ~0.4 |
| &gt; 700 | loadFactor ~0.1 (приоритет donations / broadcasters) |

---

## 7. Наблюдаемость и деплой

```mermaid
flowchart TB
  subgraph obs["Observability"]
    OTEL["OpenTelemetry<br/>traceId: Ingest → Publisher"]
    PROM["Prometheus"]
    GRAF["Grafana"]
  end

  subgraph metrics["Ключевые метрики"]
    M1["synapse_e2e_latency_ms — p95 < 4000"]
    M2["synapse_context_degraded_rate"]
    M3["synapse_gpu_queue_depth — алерт > 200"]
  end

  subgraph deploy["Типовой compose / k8s"]
    V["vllm — GPU"]
    I["synapse-ingest"]
    P["synapse-pipeline"]
    U["synapse-publisher"]
    R["redis:7"]
    PG["postgres:16"]
    Q["qdrant"]
  end

  OTEL --> PROM --> GRAF
  metrics --> GRAF
```

---

## 8. Масштабирование (честная модель)

```mermaid
flowchart LR
  GPU["+GPU реплика vLLM"] --> PW["+Pipeline Worker<br/>I/O + вызовы GPU"]
  ING["Ingest ×N"] --> CPU["CPU stateless"]
  PUB["Publisher ×K"] --> NET["Network stateless"]
```

**Правило:** throughput вокруг LLM растёт в основном с **добавлением GPU / vLLM**; Ingest и Publisher скейлятся горизонтально проще.

---

## Как смотреть

| Где | Как |
|-----|-----|
| GitHub / GitLab | Открой этот `.md` — Mermaid встроен |
| VS Code | Расширение Markdown Preview Mermaid |
| Браузер | Открой [`synapse-architecture-viewer.html`](./synapse-architecture-viewer.html) в репозитории |

Если какая-то диаграмма не рендерится (старый рендерер), упрости вложенность `subgraph` или разбей на два файла.
