using System.Text.Json.Serialization;

namespace Inktide.API.TTS.Infrastructure.LipSync;

/// <summary>
/// Viseme cue for a single Rhubarb mouth shape, serialized to the frontend.
/// </summary>
public sealed record VisemeCue(
    [property: JsonPropertyName("startMs")] int    StartMs,
    [property: JsonPropertyName("viseme")]  string Viseme);

public interface IRhubarbService
{
    bool IsAvailable { get; }

    /// <summary>
    /// Analyses <paramref name="wavBytes"/> and returns a viseme timeline,
    /// or <c>null</c> when Rhubarb is unavailable or analysis fails.
    /// </summary>
    Task<VisemeCue[]?> AnalyzeAsync(byte[] wavBytes, CancellationToken ct = default);
}
