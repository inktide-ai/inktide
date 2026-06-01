namespace Inktide.API.Soul.Domain.Entities;

public sealed class SoulActivityFeedEvent
{
    public Guid Id { get; init; }
    public Guid AiCardId { get; init; }

    /// <summary>MOOD_SHIFT | APPEARANCE_CHANGE | MILESTONE | KNOWLEDGE_GAINED | PERSONALITY_DRIFT</summary>
    public string EventType { get; init; } = string.Empty;

    /// <summary>PUBLIC | FANS_ONLY</summary>
    public string Visibility { get; init; } = "PUBLIC";

    public string RenderedCopy { get; init; } = string.Empty;

    public string Emoji { get; init; } = string.Empty;

    /// <summary>Raw values for analytics — never included in public API responses.</summary>
    public string? MetadataJson { get; init; }

    public DateTime OccurredAt { get; init; }
}
