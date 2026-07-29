namespace Inktide.API.Domain.Models;

public sealed class ProviderOptions
{
    

    private string _providerId = string.Empty;
    private string? _apiKey;
    private Dictionary<string, string> _headers = new();
    private Dictionary<string, object> _extra = new();

    
    public string ProviderId
    {
        get => _providerId;
        set => _providerId = value;
    }

    public string? ApiKey
    {
        get => _apiKey;
        set => _apiKey = value;
    }

    public string? BaseUrl { get; set; }
    
    public Dictionary<string, string> Headers
    {
        get => _headers;
        set => _headers = value;
    }

    public Dictionary<string, object> Extra
    {
        get => _extra;
        set => _extra = value;
    }

    /// <summary>
    /// True when the API key was supplied per-request (e.g. X-TTS-Api-Key header, BYOK).
    /// Infrastructure clients should NOT cache a client keyed on this key - use a transient client instead.
    /// False (default) when the key comes from static configuration; caching is safe.
    /// </summary>
    public bool ApiKeyIsTransient { get; set; }

}