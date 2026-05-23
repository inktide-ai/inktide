namespace Inktide.API.ScreenAwareness.Application.Models;

/// <summary>Structured output from the vision model for one frame.</summary>
public sealed record ScreenAnalysis(IReadOnlyList<DetectedScreenEvent> Events);
