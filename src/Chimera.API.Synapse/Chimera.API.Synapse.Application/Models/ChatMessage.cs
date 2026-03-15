namespace Chimera.API.Synapse.Application.Models;

/// <summary>
/// Mirrors the ChatMessage published by Chimera.ApiGateway.
/// Deserialized from RabbitMQ JSON payloads (camelCase).
/// </summary>
public sealed record ChatMessage(
    string PlatformId,
    string ChannelId,
    string ChannelName,
    UserMetadata Sender,
    string Text,
    DateTimeOffset Timestamp,
    StreamInfo? Stream = null);

