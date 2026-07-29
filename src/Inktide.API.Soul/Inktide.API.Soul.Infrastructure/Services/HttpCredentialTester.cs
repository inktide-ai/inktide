using Inktide.API.Soul.Application.Interfaces;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;

namespace Inktide.API.Soul.Infrastructure.Services;

/// <summary>
/// Validates a provider credential by making a minimal HTTP call to the provider's API.
/// Uses stored credentials only - keys are never returned to the client.
/// OCP: adding a new cloud provider = one entry in _cloudProviders; no method changes.
/// </summary>
public sealed class HttpCredentialTester : ICredentialTester
{
    private static readonly TimeSpan TestTimeout = TimeSpan.FromSeconds(5);

    // label: shown in error messages. addAuth: null means key-less (local).
    private sealed record ProviderDescriptor(
        string Label,
        string Url,
        Action<HttpRequestMessage, string>? AddAuth);

    private static readonly Dictionary<string, ProviderDescriptor> _cloudProviders =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["anthropic"]    = new("Anthropic",    "https://api.anthropic.com/v1/models",
                                   (r, k) => { r.Headers.Add("x-api-key", k); r.Headers.Add("anthropic-version", "2023-06-01"); }),
            ["elevenlabs"]   = new("ElevenLabs",   "https://api.elevenlabs.io/v1/user",
                                   (r, k) => r.Headers.Add("xi-api-key", k)),
            ["fish-audio"]   = new("Fish Audio",   "https://api.fish.audio/model",
                                   (r, k) => r.Headers.Authorization = new AuthenticationHeaderValue("Bearer", k)),
            ["cartesia"]     = new("Cartesia",      "https://api.cartesia.ai/voices",
                                   (r, k) => { r.Headers.Add("X-API-Key", k); r.Headers.Add("Cartesia-Version", "2024-06-10"); }),
            ["playht"]       = new("PlayHT",        "https://api.play.ht/api/v2/voices",
                                   (r, k) => r.Headers.Authorization = new AuthenticationHeaderValue("Bearer", k)),
            ["google"]       = new("Google",        string.Empty, null),   // URL built dynamically (key in query string)
            ["vertex"]       = new("Google",        string.Empty, null),
        };

    // Maps provider id -> (defaultBaseUrl, healthPath).
    private static readonly Dictionary<string, (string DefaultBase, string Path)> _localProviders =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["ollama"]    = ("http://localhost:11434", "/api/tags"),
            ["lm-studio"] = ("http://localhost:1234",  "/v1/models"),
            ["kokoro"]    = ("http://localhost:8880",   "/health"),
            ["piper"]     = (string.Empty, "/health"),
            ["coqui"]     = (string.Empty, "/health"),
            ["llamacpp"]  = (string.Empty, "/health"),
            ["llamafile"] = (string.Empty, "/health"),
            ["jan"]       = (string.Empty, "/health"),
        };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<HttpCredentialTester> _logger;

    public HttpCredentialTester(IHttpClientFactory httpClientFactory, ILogger<HttpCredentialTester> logger)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _logger            = logger            ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<CredentialTestResult> TestAsync(
        string providerId, string apiKey, string? baseUrl, string? config,
        CancellationToken ct = default)
    {
        try
        {
            return await RunTestAsync(providerId, apiKey, baseUrl, ct);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            return new CredentialTestResult(false, "Request timed out after 5 seconds.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogDebug(ex, "Credential test HTTP error for provider {ProviderId}", providerId);
            return new CredentialTestResult(false, $"Cannot reach provider: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unexpected error testing credential for provider {ProviderId}", providerId);
            return new CredentialTestResult(false, "Unexpected error during validation.");
        }
    }

    private async Task<CredentialTestResult> RunTestAsync(
        string providerId, string apiKey, string? baseUrl, CancellationToken ct)
    {
        using var cts    = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TestTimeout);
        using var client = _httpClientFactory.CreateClient("credential-tester");

        if (_cloudProviders.TryGetValue(providerId, out var desc))
        {
            if (desc.AddAuth is not null && string.IsNullOrWhiteSpace(apiKey))
                return new CredentialTestResult(false, "API key is required.");

            // Google/Vertex: key goes in the query string, not a header
            if (providerId.Equals("google", StringComparison.OrdinalIgnoreCase) ||
                providerId.Equals("vertex", StringComparison.OrdinalIgnoreCase))
            {
                var url = $"https://generativelanguage.googleapis.com/v1/models?key={Uri.EscapeDataString(apiKey)}";
                var res = await client.GetAsync(url, cts.Token).ConfigureAwait(false);
                return MapHttpResult(res, desc.Label);
            }

            // Azure has two variants handled below; all other cloud providers use the registry
            using var req = new HttpRequestMessage(HttpMethod.Get, desc.Url);
            desc.AddAuth!(req, apiKey);
            var response = await client.SendAsync(req, cts.Token).ConfigureAwait(false);
            return MapHttpResult(response, desc.Label);
        }

        if (providerId.Equals("azure-openai", StringComparison.OrdinalIgnoreCase) ||
            providerId.Equals("azure", StringComparison.OrdinalIgnoreCase))
            return await TestAzureAsync(client, apiKey, baseUrl, cts.Token).ConfigureAwait(false);

        if (providerId.Equals("azure-speech", StringComparison.OrdinalIgnoreCase))
            return await TestAzureSpeechAsync(client, apiKey, baseUrl, cts.Token).ConfigureAwait(false);

        if (_localProviders.TryGetValue(providerId, out var local))
        {
            var effectiveBase = string.IsNullOrWhiteSpace(baseUrl) ? local.DefaultBase : baseUrl;
            return await TestLocalAsync(client, effectiveBase, local.Path, cts.Token).ConfigureAwait(false);
        }

        return await TestOpenAiCompatibleAsync(client, apiKey, baseUrl, cts.Token).ConfigureAwait(false);
    }


    private static async Task<CredentialTestResult> TestAzureAsync(
        HttpClient client, string apiKey, string? baseUrl, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");
        if (string.IsNullOrWhiteSpace(baseUrl))
            return new CredentialTestResult(false, "Azure OpenAI requires a base URL (your resource endpoint).");

        using var req = new HttpRequestMessage(HttpMethod.Get,
            $"{baseUrl.TrimEnd('/')}/openai/models?api-version=2024-02-01");
        req.Headers.Add("api-key", apiKey);
        var res = await client.SendAsync(req, ct).ConfigureAwait(false);
        return MapHttpResult(res, "Azure OpenAI");
    }

    private static async Task<CredentialTestResult> TestAzureSpeechAsync(
        HttpClient client, string apiKey, string? baseUrl, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");

        var region = string.IsNullOrWhiteSpace(baseUrl) ? "eastus" : baseUrl.Trim();
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken");
        req.Headers.Add("Ocp-Apim-Subscription-Key", apiKey);
        var res = await client.SendAsync(req, ct).ConfigureAwait(false);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"Azure Speech returned {(int)res.StatusCode}. Check key and region.");
    }


    private static async Task<CredentialTestResult> TestLocalAsync(
        HttpClient client, string baseUrl, string path, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
            return new CredentialTestResult(false, "Base URL is required for local providers.");

        var res = await client.GetAsync($"{baseUrl.TrimEnd('/')}{path}", ct).ConfigureAwait(false);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"Local provider returned {(int)res.StatusCode}. Is it running?");
    }

    private static async Task<CredentialTestResult> TestOpenAiCompatibleAsync(
        HttpClient client, string apiKey, string? baseUrl, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");

        var endpoint = string.IsNullOrWhiteSpace(baseUrl)
            ? "https://api.openai.com/v1"
            : baseUrl.TrimEnd('/');

        using var req = new HttpRequestMessage(HttpMethod.Get, $"{endpoint}/models");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        var res = await client.SendAsync(req, ct).ConfigureAwait(false);
        if (res.IsSuccessStatusCode)
            return new CredentialTestResult(true, null);
        if (res.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            return new CredentialTestResult(false, "Invalid API key (401 Unauthorized).");
        return new CredentialTestResult(false, $"Provider returned {(int)res.StatusCode}: {res.ReasonPhrase}");
    }


    private static CredentialTestResult MapHttpResult(HttpResponseMessage res, string label) =>
        res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"{label} returned {(int)res.StatusCode}: {res.ReasonPhrase}");
}
