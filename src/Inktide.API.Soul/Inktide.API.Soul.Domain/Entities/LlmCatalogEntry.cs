namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// Global catalog of available LLM models. Managed by admins.
/// AI cards reference this via FK to select their model.
/// </summary>
public sealed class LlmCatalogEntry
{

    private Guid _id;
    private string _provider = string.Empty;
    private string _modelId = string.Empty;
    private string _displayName = string.Empty;
    private string _tier = "free";
    private bool _isAvailable = true;
    private DateTime _createdAt;


    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public string Provider
    {
        get => _provider;
        set => _provider = value;
    }

    public string ModelId
    {
        get => _modelId;
        set => _modelId = value;
    }

    public string DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    public string Tier
    {
        get => _tier;
        set => _tier = value;
    }

    public bool IsAvailable
    {
        get => _isAvailable;
        set => _isAvailable = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    /// <summary>
    /// True when the provider requires a BYOK API key.
    /// Local/self-hosted providers (Ollama, LM Studio) don't require one.
    /// </summary>
    public bool RequiresApiKey => !LocalProviders.Contains(Provider);

    private static readonly HashSet<string> LocalProviders =
        new(StringComparer.OrdinalIgnoreCase) { "ollama", "lm-studio", "llamacpp", "llamafile" };

}
