namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Fan-in payload: RAG, Session, Context and Emotion scatter results for one stream event.
/// </summary>
public sealed record SynapseAggregatedEnvelope(
    string TransportMessageId,
    string CorrelationId,
    DateTimeOffset AggregatedAtUtc,
    ChatMessage Message,
    RagContext? Rag,
    ContextShardPayload? Context,
    SessionContext? Session,
    EmotionResult? Emotion = null);
