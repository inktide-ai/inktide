using Inktide.API.Soul.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Soul.Infrastructure.Services;

/// <summary>
/// Validates a provider credential by making a minimal HTTP call to the provider's API.
/// Uses stored credentials only — keys are never returned to the client.
/// </summary>
public sealed class HttpCredentialTester : ICredentialTester
{

    private static readonly TimeSpan TestTimeout = TimeSpan.FromSeconds(5);

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

        return providerId.ToLowerInvariant() switch
        {
            "anthropic"   => await TestAnthropicAsync(client, apiKey, cts.Token),
            "elevenlabs"  => await TestElevenLabsAsync(client, apiKey, cts.Token),
            "fish-audio"  => await TestFishAudioAsync(client, apiKey, cts.Token),
            "cartesia"    => await TestCartesiaAsync(client, apiKey, cts.Token),
            "playht"      => await TestPlayHtAsync(client, apiKey, cts.Token),
            "google" or "vertex" => await TestGoogleAsync(client, apiKey, cts.Token),
            "azure-openai" or "azure" => await TestAzureAsync(client, apiKey, baseUrl, cts.Token),
            "azure-speech" => await TestAzureSpeechAsync(client, apiKey, baseUrl, cts.Token),
            "ollama"      => await TestLocalAsync(client, baseUrl ?? "http://localhost:11434", "/api/tags", cts.Token),
            "lm-studio"   => await TestLocalAsync(client, baseUrl ?? "http://localhost:1234", "/v1/models", cts.Token),
            "kokoro"      => await TestLocalAsync(client, baseUrl ?? "http://localhost:8880", "/health", cts.Token),
            "piper" or "coqui" or "llamacpp" or "llamafile" or "jan"
                          => await TestLocalAsync(client, baseUrl ?? string.Empty, "/health", cts.Token),
            _             => await TestOpenAiCompatibleAsync(client, apiKey, baseUrl, cts.Token),
        };
    }


    // ── Provider-specific test methods ───────────────────────────────────────────

    private static async Task<CredentialTestResult> TestAnthropicAsync(
        HttpClient client, string apiKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");

        using var req = new HttpRequestMessage(HttpMethod.Get, "https://api.anthropic.com/v1/models");
        req.Headers.Add("x-api-key", apiKey);
        req.Headers.Add("anthropic-version", "2023-06-01");

        var res = await client.SendAsync(req, ct);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"Anthropic returned {(int)res.StatusCode}: {res.ReasonPhrase}");
    }

    private static async Task<CredentialTestResult> TestElevenLabsAsync(
        HttpClient client, string apiKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");

        using var req = new HttpRequestMessage(HttpMethod.Get, "https://api.elevenlabs.io/v1/user");
        req.Headers.Add("xi-api-key", apiKey);

        var res = await client.SendAsync(req, ct);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"ElevenLabs returned {(int)res.StatusCode}: {res.ReasonPhrase}");
    }

    private static async Task<CredentialTestResult> TestFishAudioAsync(
        HttpClient client, string apiKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");

        using var req = new HttpRequestMessage(HttpMethod.Get, "https://api.fish.audio/model");
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var res = await client.SendAsync(req, ct);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"Fish Audio returned {(int)res.StatusCode}: {res.ReasonPhrase}");
    }

    private static async Task<CredentialTestResult> TestCartesiaAsync(
        HttpClient client, string apiKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");

        using var req = new HttpRequestMessage(HttpMethod.Get, "https://api.cartesia.ai/voices");
        req.Headers.Add("X-API-Key", apiKey);
        req.Headers.Add("Cartesia-Version", "2024-06-10");

        var res = await client.SendAsync(req, ct);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"Cartesia returned {(int)res.StatusCode}: {res.ReasonPhrase}");
    }

    private static async Task<CredentialTestResult> TestPlayHtAsync(
        HttpClient client, string apiKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");

        // PlayHT uses userId:apiKey format stored in config — check key presence only
        using var req = new HttpRequestMessage(HttpMethod.Get, "https://api.play.ht/api/v2/voices");
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var res = await client.SendAsync(req, ct);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"PlayHT returned {(int)res.StatusCode}: {res.ReasonPhrase}");
    }

    private static async Task<CredentialTestResult> TestGoogleAsync(
        HttpClient client, string apiKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");

        var url = $"https://generativelanguage.googleapis.com/v1/models?key={Uri.EscapeDataString(apiKey)}";
        var res = await client.GetAsync(url, ct);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"Google returned {(int)res.StatusCode}: {res.ReasonPhrase}");
    }

    private static async Task<CredentialTestResult> TestAzureAsync(
        HttpClient client, string apiKey, string? baseUrl, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return new CredentialTestResult(false, "API key is required.");
        if (string.IsNullOrWhiteSpace(baseUrl))
            return new CredentialTestResult(false, "Azure OpenAI requires a base URL (your resource endpoint).");

        var url = $"{baseUrl.TrimEnd('/')}/openai/models?api-version=2024-02-01";
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Add("api-key", apiKey);

        var res = await client.SendAsync(req, ct);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"Azure OpenAI returned {(int)res.StatusCode}: {res.ReasonPhrase}");
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

        var res = await client.SendAsync(req, ct);
        return res.IsSuccessStatusCode
            ? new CredentialTestResult(true, null)
            : new CredentialTestResult(false, $"Azure Speech returned {(int)res.StatusCode}. Check key and region.");
    }

    private static async Task<CredentialTestResult> TestLocalAsync(
        HttpClient client, string baseUrl, string path, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
            return new CredentialTestResult(false, "Base URL is required for local providers.");

        var url = $"{baseUrl.TrimEnd('/')}{path}";
        var res = await client.GetAsync(url, ct);
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
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var res = await client.SendAsync(req, ct);
        if (res.IsSuccessStatusCode)
            return new CredentialTestResult(true, null);
        if (res.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            return new CredentialTestResult(false, "Invalid API key (401 Unauthorized).");

        return new CredentialTestResult(false, $"Provider returned {(int)res.StatusCode}: {res.ReasonPhrase}");
    }

}
