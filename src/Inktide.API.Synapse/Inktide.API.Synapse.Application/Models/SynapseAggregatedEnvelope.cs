namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Fan-in payload: RAG, Session, Context, Emotion and PhysicalState scatter results for one stream event.
/// Emotion carries the full runtime <see cref="EmotionalState"/> (blended trajectory, momentum).
/// Physical carries energy/attention/comfort that drive body physics and idle thresholds.
/// </summary>
public sealed record SynapseAggregatedEnvelope(
    string TransportMessageId,
    string CorrelationId,
    DateTimeOffset AggregatedAtUtc,
    ChatMessage Message,
    RagContext? Rag,
    ContextShardPayload? Context,
    SessionContext? Session,
    EmotionalState? Emotion = null,
    ScreenContext? Screen = null,
    WebhookContext? Webhook = null,
    PhysicalState? Physical = null)
{
    public int SchemaVersion { get; init; } = 1;
}
