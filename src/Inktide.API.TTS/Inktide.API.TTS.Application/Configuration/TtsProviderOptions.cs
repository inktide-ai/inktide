namespace Inktide.API.TTS.Application.Configuration;

/// <summary>
/// Application configuration for TTS / speech providers (defaults only; secrets via provider options).
/// </summary>
public sealed class TtsProviderOptions
{
    public const string SectionName = "TtsProviders";

    /// <summary>
    /// Provider id when the caller does not specify one (must exist in the speech provider registry).
    /// </summary>
    public string DefaultProviderId { get; set; } = "kokoro";

    /// <summary>
    /// Optional feature switches for routing / experiments.
    /// </summary>
    public Dictionary<string, bool>? FeatureFlags { get; set; }

}
