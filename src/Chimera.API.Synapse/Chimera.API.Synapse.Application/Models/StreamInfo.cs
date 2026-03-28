namespace Chimera.API.Synapse.Application.Models;

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
