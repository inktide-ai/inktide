using Chimera.API.Domain.Models;

namespace Chimera.API.Core.Configuration;

/// <summary>
/// Application configuration for chat providers (defaults, feature flags).
/// API keys and secrets must not live here — pass them per call via <see cref="ProviderOptions"/>
/// (populated from user secrets, vault, or your secret store at the application boundary).
/// </summary>
public sealed class ChatProviderOptions
{
    public const string SectionName = "ChatProviders";

    #region Fields

    private string _defaultProviderId = "echo";
    private Dictionary<string, bool>? _featureFlags;

    #endregion

    #region Properties

    /// <summary>
    /// Provider id used when the caller does not specify one (must exist in <see cref="IChatProviderRegistry"/>).
    /// </summary>
    public string DefaultProviderId
    {
        get => _defaultProviderId;
        set => _defaultProviderId = value;
    }

    /// <summary>
    /// Optional feature switches (e.g. enable beta routing). Keys are arbitrary strings understood by your app.
    /// </summary>
    public Dictionary<string, bool>? FeatureFlags
    {
        get => _featureFlags;
        set => _featureFlags = value;
    }

    #endregion
}
