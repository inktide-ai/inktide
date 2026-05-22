namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Fan-in payload: RAG, Session, Context and Emotion scatter results for one stream event.
/// Emotion carries the full runtime <see cref="EmotionalState"/> (blended trajectory, momentum)
/// rather than the raw single-turn <see cref="EmotionResult"/>.
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
    WebhookContext? Webhook = null)
{
    public int SchemaVersion { get; init; } = 1;
}
