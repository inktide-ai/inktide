namespace Chimera.API.Connector.Application.Models;

/// <summary>Live status of a channel at the time a message was received.</summary>
public enum StreamStatus
{
    Unknown = 0,
    Offline = 1,
    Live = 2
}

/// <summary>Channel stream snapshot (live/offline). Populated only when extra API calls are made.</summary>
public sealed record StreamInfo(
    string ChannelId,
    StreamStatus Status,
    DateTimeOffset? StartedAt = null);
