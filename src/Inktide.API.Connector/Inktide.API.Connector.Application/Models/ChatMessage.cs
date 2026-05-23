namespace Inktide.API.Connector.Application.Models;

/// <summary>Normalized chat message from any platform, ready for Synapse ingest (Redis Stream).</summary>
public sealed record ChatMessage(
    string PlatformId,
    string ChannelId,
    string ChannelName,
    UserMetadata Sender,
    string Text,
    DateTimeOffset Timestamp,
    StreamInfo? Stream = null)
{
    /// <summary>
    /// When set, routes this message to a specific character (AI card).
    /// Populated by the GuildSoulRegistry for Discord messages.
    /// </summary>
    public Guid? CharacterId { get; init; }
}
