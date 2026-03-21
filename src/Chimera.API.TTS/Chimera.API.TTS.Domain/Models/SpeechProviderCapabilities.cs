namespace Chimera.API.TTS.Domain.Models;

/// <summary>
/// Declared TTS / speech provider capabilities for catalog and routing.
/// </summary>
public sealed class SpeechProviderCapabilities
{
    #region Fields

    private bool _supportsVoiceListing;
    private bool _supportsStreaming;
    private bool _requiresApiKey;

    #endregion

    #region Properties

    /// <summary>
    /// When true, the HTTP layer fills <c>ProviderOptions.ApiKey</c> from header <c>X-TTS-Api-Key</c> or config <c>TtsProviders:{providerId}:ApiKey</c>.
    /// </summary>
    public bool RequiresApiKey
    {
        get => _requiresApiKey;
        set => _requiresApiKey = value;
    }

    public bool SupportsVoiceListing
    {
        get => _supportsVoiceListing;
        set => _supportsVoiceListing = value;
    }

    /// <summary>
    /// True if the provider can stream audio chunks (future / not all APIs).
    /// </summary>
    public bool SupportsStreaming
    {
        get => _supportsStreaming;
        set => _supportsStreaming = value;
    }

    #endregion
}
