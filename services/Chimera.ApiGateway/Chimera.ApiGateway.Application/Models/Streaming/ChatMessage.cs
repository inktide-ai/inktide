namespace Chimera.ApiGateway.Application.Models.Streaming;

/// <summary>Normalized chat message from any platform, ready for RabbitMQ publishing.</summary>
public sealed record ChatMessage(
    string PlatformId,
    string ChannelId,
    string ChannelName,
    UserMetadata Sender,
    string Text,
    DateTimeOffset Timestamp,
    StreamInfo? Stream = null);
