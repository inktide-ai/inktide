namespace Chimera.AI.Orchestrator.Application.Models;

/// <summary>
/// A single memory retrieved from the vector store.
/// Returned by <see cref="Contracts.IMemoryService.SearchAsync"/>.
/// </summary>
public sealed record MemoryFragment(
    Guid Id,
    string Text,
    float Score,
    MemoryType Type,
    string ViewerId,
    string Platform,
    string? ChannelId,
    DateTimeOffset Timestamp);
