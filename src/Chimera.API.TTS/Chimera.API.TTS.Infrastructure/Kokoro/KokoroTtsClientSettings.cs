using Chimera.API.Domain.Models;

namespace Chimera.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// App defaults for Kokoro; per-tenant URL usually comes from <see cref="ProviderOptions.Endpoint"/>.
/// </summary>
public sealed class KokoroTtsClientSettings
{
    public const string SectionName = "TtsProviders:Kokoro";

    #region Fields

    private Uri? _endpoint;

    #endregion

    #region Properties

    /// <summary>
    /// Default v1 API root, e.g. <c>http://127.0.0.1:8880/v1/</c> (with or without trailing slash).
    /// </summary>
    public Uri? Endpoint
    {
        get => _endpoint;
        set => _endpoint = value;
    }

    #endregion
}
