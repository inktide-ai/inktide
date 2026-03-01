namespace Chimera.AI.Orchestrator.Infrastructure.Models;

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

public sealed record UserMetadata(
    string UserId,
    string UserName,
    IReadOnlyList<string> Badges,
    bool IsModerator,
    bool IsSubscriber,
    bool IsVip,
    bool IsBroadcaster,
    string? Color = null);

public enum StreamStatus
{
    Unknown = 0,
    Offline = 1,
    Live = 2
}

public sealed record StreamInfo(
    string ChannelId,
    StreamStatus Status,
    DateTimeOffset? StartedAt = null);
