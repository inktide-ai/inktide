namespace Chimera.AI.Orchestrator.Application.Models;

/// <summary>
/// A memory to be written into the vector store.
/// Contains both the raw text and its pre-computed embedding vector.
/// </summary>
public sealed record MemoryEntry(
    string Text,
    float[] Vector,
    MemoryType Type,
    string ViewerId,
    string ViewerName,
    string Platform,
    string ChannelId,
    string ChannelName,
    DateTimeOffset Timestamp);
