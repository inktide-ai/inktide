using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Inktide.API.Developer.Application.Interfaces;
using Inktide.API.Developer.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Developer.Infrastructure.Services;

internal sealed class KeycloakClientService : IKeycloakClientService
{
    private const string HttpClientName = "DeveloperKeycloakAdmin";

    private readonly DeveloperKeycloakSettings _settings;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<KeycloakClientService> _logger;

    public KeycloakClientService(
        IHttpClientFactory httpFactory,
        DeveloperKeycloakSettings settings,
        ILogger<KeycloakClientService> logger)
    {
        _httpFactory = httpFactory ?? throw new ArgumentNullException(nameof(httpFactory));
        _settings    = settings    ?? throw new ArgumentNullException(nameof(settings));
        _logger      = logger      ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<(string KeycloakClientId, string PlainSecret)> CreateClientAsync(
        string appName, string[] redirectUris, CancellationToken ct)
    {
        var token = await GetAdminTokenAsync(ct)
            ?? throw new InvalidOperationException("Could not obtain Keycloak admin token.");

        using var http = _httpFactory.CreateClient(HttpClientName);
        var url = $"{_settings.BaseUrl.TrimEnd('/')}/admin/realms/{Uri.EscapeDataString(_settings.Realm)}/clients";

        // Generate a unique client_id
        var clientId = $"inkt_{Guid.NewGuid():N}";

        var body = JsonSerializer.Serialize(new
        {
            clientId,
            name             = appName,
            enabled          = true,
            protocol         = "openid-connect",
            publicClient     = false,
            standardFlowEnabled = true,
            serviceAccountsEnabled = false,
            redirectUris     = redirectUris,
            webOrigins       = new[] { "+" },
        });

        using var req = new HttpRequestMessage(HttpMethod.Post, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        req.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var res = await http.SendAsync(req, ct);

        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            _logger.LogError("Keycloak create client failed {Status}: {Body}", (int)res.StatusCode, err);
            throw new InvalidOperationException($"Keycloak create client failed: {(int)res.StatusCode}");
        }

        // Location header contains the UUID of the created client
        var location = res.Headers.Location?.ToString()
            ?? throw new InvalidOperationException("Keycloak did not return a Location header.");
        var keycloakId = location.Split('/').Last();

        // Fetch the generated secret
        var secret = await GetClientSecretAsync(http, token, keycloakId, ct);
        return (keycloakId, secret);
    }

    public async Task DeleteClientAsync(string keycloakClientId, CancellationToken ct)
    {
        var token = await GetAdminTokenAsync(ct);
        if (token is null) return;

        using var http = _httpFactory.CreateClient(HttpClientName);
        var url = $"{_settings.BaseUrl.TrimEnd('/')}/admin/realms/{Uri.EscapeDataString(_settings.Realm)}/clients/{keycloakClientId}";

        using var req = new HttpRequestMessage(HttpMethod.Delete, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var res = await http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode && res.StatusCode != System.Net.HttpStatusCode.NotFound)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Keycloak delete client {Status}: {Body}", (int)res.StatusCode, err);
        }
    }

    public async Task<string> RotateSecretAsync(string keycloakClientId, CancellationToken ct)
    {
        var token = await GetAdminTokenAsync(ct)
            ?? throw new InvalidOperationException("Could not obtain Keycloak admin token.");

        using var http = _httpFactory.CreateClient(HttpClientName);
        return await GetClientSecretAsync(http, token, keycloakClientId, ct, regenerate: true);
    }

    private async Task<string> GetClientSecretAsync(
        HttpClient http, string token, string keycloakClientId, CancellationToken ct, bool regenerate = false)
    {
        var baseUrl = _settings.BaseUrl.TrimEnd('/');
        var realm   = Uri.EscapeDataString(_settings.Realm);
        var url     = regenerate
            ? $"{baseUrl}/admin/realms/{realm}/clients/{keycloakClientId}/client-secret"
            : $"{baseUrl}/admin/realms/{realm}/clients/{keycloakClientId}/client-secret";

        var method = regenerate ? HttpMethod.Post : HttpMethod.Get;
        using var req = new HttpRequestMessage(method, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var res = await http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        return doc.RootElement.GetProperty("value").GetString()
               ?? throw new InvalidOperationException("Keycloak returned empty client secret.");
    }

    private async Task<string?> GetAdminTokenAsync(CancellationToken ct)
    {
        if (!_settings.Enabled) return null;

        var url = $"{_settings.BaseUrl.TrimEnd('/')}/realms/{Uri.EscapeDataString(_settings.Realm)}/protocol/openid-connect/token";

        using var http = _httpFactory.CreateClient(HttpClientName);
        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"]    = "client_credentials",
            ["client_id"]     = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
        });

        HttpResponseMessage res;
        try
        {
            res = await http.PostAsync(url, content, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Keycloak admin token request failed");
            return null;
        }

        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Keycloak admin token error {Status}: {Body}", (int)res.StatusCode, err);
            return null;
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        return doc.RootElement.TryGetProperty("access_token", out var el) ? el.GetString() : null;
    }
}
