namespace Inktide.API.ScreenAwareness.Application.Models;

/// <summary>A single event identified by the vision model in one frame.</summary>
public sealed record DetectedScreenEvent(
    string EventType,
    float Confidence,
    IReadOnlyDictionary<string, string> Metadata);
