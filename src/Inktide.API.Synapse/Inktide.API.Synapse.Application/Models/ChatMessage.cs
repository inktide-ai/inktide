namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Mirrors the ChatMessage published by Inktide.ApiGateway.
/// Deserialized from Synapse ingest Redis stream JSON payloads (camelCase).
/// </summary>
public sealed record ChatMessage(
    string PlatformId,
    string ChannelId,
    string ChannelName,
    UserMetadata Sender,
    string Text,
    DateTimeOffset Timestamp,
    StreamInfo? Stream = null);

