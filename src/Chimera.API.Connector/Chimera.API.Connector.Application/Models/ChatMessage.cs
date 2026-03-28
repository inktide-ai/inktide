namespace Chimera.API.Connector.Application.Models;

/// <summary>Normalized chat message from any platform, ready for Synapse ingest (Redis Stream).</summary>
public sealed record ChatMessage(
    string PlatformId,
    string ChannelId,
    string ChannelName,
    UserMetadata Sender,
    string Text,
    DateTimeOffset Timestamp,
    StreamInfo? Stream = null);
