using Inktide.API.Domain.Models;

namespace Inktide.API.Core.Configuration;

/// <summary>
/// Application configuration for chat providers (defaults, feature flags).
/// API keys and secrets must not live here - pass them per call via <see cref="ProviderOptions"/>
/// (populated from user secrets, vault, or your secret store at the application boundary).
/// </summary>
public sealed class ChatProviderOptions
{
    public const string SectionName = "ChatProviders";


    private string _defaultProviderId = "echo";
    private Dictionary<string, bool>? _featureFlags;


    public string DefaultProviderId
    {
        get => _defaultProviderId;
        set => _defaultProviderId = value;
    }

    public Dictionary<string, bool>? FeatureFlags
    {
        get => _featureFlags;
        set => _featureFlags = value;
    }

}
