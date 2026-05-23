namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Slim projection of a detected screen event, carried in <see cref="ScreenContext"/>
/// and injected into the LLM system prompt.
/// </summary>
public sealed record ScreenEventSummary(
    string EventType,
    float Confidence,
    IReadOnlyDictionary<string, string> Metadata,
    DateTimeOffset DetectedAt);
