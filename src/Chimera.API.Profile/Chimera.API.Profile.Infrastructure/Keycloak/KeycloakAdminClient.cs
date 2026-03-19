using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Chimera.API.Profile.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Chimera.API.Profile.Infrastructure.Keycloak;

public sealed class KeycloakAdminClient : IKeycloakAdminClient
{
    #region Fields

    private readonly KeycloakAdminSettings _settings;
    private readonly ILogger<KeycloakAdminClient> _logger;
    private readonly HttpClient _http;

    #endregion

    #region Constructors

    public KeycloakAdminClient(KeycloakAdminSettings settings, ILogger<KeycloakAdminClient> logger)
    {
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    #endregion

    #region Public Methods

    public async Task<(bool Success, string? ErrorMessage)> TryDeleteUserAsync(Guid userId, CancellationToken ct = default)
    {
        if (!_settings.Enabled)
            return (true, null);

        if (string.IsNullOrWhiteSpace(_settings.Realm)
            || string.IsNullOrWhiteSpace(_settings.ClientId)
            || string.IsNullOrWhiteSpace(_settings.ClientSecret))
        {
            _logger.LogWarning("Keycloak Admin is enabled but Realm, ClientId, or ClientSecret is missing.");
            return (false, "Keycloak Admin is misconfigured.");
        }

        var baseUrl = _settings.BaseUrl.TrimEnd('/');
        var token = await RequestTokenAsync(baseUrl, ct).ConfigureAwait(false);
        if (token is null)
            return (false, "Keycloak token request failed.");

        var deleteUrl =
            $"{baseUrl}/admin/realms/{Uri.EscapeDataString(_settings.Realm)}/users/{userId:D}";
        using var req = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage res;
        try
        {
            res = await _http.SendAsync(req, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Keycloak DELETE user failed for {UserId}", userId);
            return (false, ex.Message);
        }

        if (res.IsSuccessStatusCode || res.StatusCode == System.Net.HttpStatusCode.NotFound)
            return (true, null);

        var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        _logger.LogWarning("Keycloak delete user {Status}: {Body}", (int)res.StatusCode, body);
        return (false, $"Keycloak returned {(int)res.StatusCode}.");
    }

    public async Task<(bool Success, string? ErrorMessage)> TrySetUserAttributeAsync(
        Guid userId,
        string attributeName,
        IReadOnlyList<string> values,
        CancellationToken ct = default)
    {
        if (!_settings.Enabled)
            return (false, "Keycloak Admin is disabled.");

        if (string.IsNullOrWhiteSpace(_settings.Realm)
            || string.IsNullOrWhiteSpace(_settings.ClientId)
            || string.IsNullOrWhiteSpace(_settings.ClientSecret))
        {
            _logger.LogWarning("Keycloak Admin is enabled but Realm, ClientId, or ClientSecret is missing.");
            return (false, "Keycloak Admin is misconfigured.");
        }

        if (string.IsNullOrWhiteSpace(attributeName))
            return (false, "Attribute name is required.");

        var baseUrl = _settings.BaseUrl.TrimEnd('/');
        var token = await RequestTokenAsync(baseUrl, ct).ConfigureAwait(false);
        if (token is null)
            return (false, "Keycloak token request failed.");

        var userUrl =
            $"{baseUrl}/admin/realms/{Uri.EscapeDataString(_settings.Realm)}/users/{userId:D}";

        using var getReq = new HttpRequestMessage(HttpMethod.Get, userUrl);
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage getRes;
        try
        {
            getRes = await _http.SendAsync(getReq, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Keycloak GET user failed for {UserId}", userId);
            return (false, ex.Message);
        }

        if (!getRes.IsSuccessStatusCode)
        {
            var err = await getRes.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            _logger.LogWarning("Keycloak GET user {Status}: {Body}", (int)getRes.StatusCode, err);
            return (false, $"Keycloak returned {(int)getRes.StatusCode} when loading user.");
        }

        await using var getStream = await getRes.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        var root = (JsonObject)(JsonNode.Parse(getStream) ?? new JsonObject());

        var attrs = root["attributes"]?.AsObject() ?? new JsonObject();
        var arr = new JsonArray();
        foreach (var v in values)
            arr.Add(v);

        attrs[attributeName] = arr;
        root["attributes"] = attrs;

        using var putReq = new HttpRequestMessage(HttpMethod.Put, userUrl);
        putReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        putReq.Content = new StringContent(root.ToJsonString(), Encoding.UTF8, "application/json");

        HttpResponseMessage putRes;
        try
        {
            putRes = await _http.SendAsync(putReq, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Keycloak PUT user failed for {UserId}", userId);
            return (false, ex.Message);
        }

        if (putRes.IsSuccessStatusCode)
            return (true, null);

        var putBody = await putRes.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        _logger.LogWarning("Keycloak PUT user {Status}: {Body}", (int)putRes.StatusCode, putBody);
        return (false, $"Keycloak returned {(int)putRes.StatusCode}.");
    }

    #endregion

    #region Private Methods

    private async Task<string?> RequestTokenAsync(string baseUrl, CancellationToken ct)
    {
        var tokenUrl =
            $"{baseUrl}/realms/{Uri.EscapeDataString(_settings.Realm)}/protocol/openid-connect/token";

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
        });

        HttpResponseMessage res;
        try
        {
            res = await _http.PostAsync(tokenUrl, content, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Keycloak token request failed");
            return null;
        }

        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            _logger.LogWarning("Keycloak token error {Status}: {Body}", (int)res.StatusCode, err);
            return null;
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);
        if (!doc.RootElement.TryGetProperty("access_token", out var tokenEl))
            return null;

        return tokenEl.GetString();
    }

    #endregion
}
