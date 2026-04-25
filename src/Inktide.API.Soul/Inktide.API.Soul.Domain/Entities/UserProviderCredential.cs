namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// Per-user LLM/TTS provider credential — BYOK (Bring Your Own Key).
/// One row per (user_id, provider_id) pair. The API key is encrypted at the application layer.
/// </summary>
public sealed class UserProviderCredential
{

    private Guid _id;
    private Guid _userId;
    private string _providerId = string.Empty;
    private string? _apiKeyEnc;
    private string? _baseUrl;
    private bool _isActive = true;
    private DateTime _createdAt;
    private DateTime _updatedAt;


    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public Guid UserId
    {
        get => _userId;
        set => _userId = value;
    }

    /// <summary>Provider identifier, e.g. "openai", "openrouter", "groq".</summary>
    public string ProviderId
    {
        get => _providerId;
        set => _providerId = value;
    }

    /// <summary>Encrypted at application layer — null for key-less providers (e.g. Ollama).</summary>
    public string? ApiKeyEnc
    {
        get => _apiKeyEnc;
        set => _apiKeyEnc = value;
    }

    /// <summary>Optional base URL override, e.g. "https://openrouter.ai/api/v1".</summary>
    public string? BaseUrl
    {
        get => _baseUrl;
        set => _baseUrl = value;
    }

    /// <summary>Provider-specific config JSON (thinkingMode, custom headers, etc.).</summary>
    public string? Config { get; set; }

    public bool IsActive
    {
        get => _isActive;
        set => _isActive = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    public DateTime UpdatedAt
    {
        get => _updatedAt;
        set => _updatedAt = value;
    }

}
