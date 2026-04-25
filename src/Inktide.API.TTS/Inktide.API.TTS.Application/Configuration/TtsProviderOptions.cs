namespace Inktide.API.TTS.Application.Configuration;

/// <summary>
/// Application configuration for TTS / speech providers (defaults only; secrets via provider options).
/// </summary>
public sealed class TtsProviderOptions
{
    public const string SectionName = "TtsProviders";


    private string _defaultProviderId = "kokoro";
    private Dictionary<string, bool>? _featureFlags;


    /// <summary>
    /// Provider id when the caller does not specify one (must exist in the speech provider registry).
    /// </summary>
    public string DefaultProviderId
    {
        get => _defaultProviderId;
        set => _defaultProviderId = value;
    }

    /// <summary>
    /// Optional feature switches for routing / experiments.
    /// </summary>
    public Dictionary<string, bool>? FeatureFlags
    {
        get => _featureFlags;
        set => _featureFlags = value;
    }

}
