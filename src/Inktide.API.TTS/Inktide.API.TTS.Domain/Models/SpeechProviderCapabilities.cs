namespace Inktide.API.TTS.Domain.Models;

/// <summary>
/// Declared TTS / speech provider capabilities for catalog and routing.
/// </summary>
public sealed record SpeechProviderCapabilities
{
    /// <summary>
    /// When true, the HTTP layer fills <c>ProviderOptions.ApiKey</c> from header <c>X-TTS-Api-Key</c> or config <c>TtsProviders:{providerId}:ApiKey</c>.
    /// </summary>
    public bool RequiresApiKey { get; init; }

    public bool SupportsVoiceListing { get; init; }

    /// <summary>
    /// True if the provider can stream audio chunks (future / not all APIs).
    /// </summary>
    public bool SupportsStreaming { get; init; }

    /// <summary>
    /// True if <c>GetModelsAsync</c> fetches live data from the provider API.
    /// False means a static built-in list is returned.
    /// </summary>
    public bool SupportsModelListing { get; init; }
}
