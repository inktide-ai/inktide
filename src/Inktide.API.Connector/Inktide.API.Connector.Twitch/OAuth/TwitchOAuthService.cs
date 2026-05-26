using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Connector.Application.OAuth;
using Inktide.API.Connector.Twitch.Settings;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Twitch.OAuth;

public sealed class TwitchOAuthService : ITwitchOAuthService
{
    private const string TokenUrl  = "https://id.twitch.tv/oauth2/token";
    private const string RevokeUrl = "https://id.twitch.tv/oauth2/revoke";
    private const string UsersUrl  = "https://api.twitch.tv/helix/users";
    private const string Scopes    = "chat:read chat:edit";

    private readonly TwitchSettings  _settings;
    private readonly ITokenProtector _tokenProtector;
    private readonly HttpClient      _http;

    public TwitchOAuthService(
        IOptions<TwitchSettings> settings,
        [FromKeyedServices(TokenProtectorKeys.Twitch)] ITokenProtector tokenProtector,
        HttpClient http)
    {
        _settings       = settings.Value;
        _tokenProtector = tokenProtector;
        _http           = http;
    }

    public string BuildInstallUrl(string state) =>
        "https://id.twitch.tv/oauth2/authorize" +
        $"?client_id={Uri.EscapeDataString(_settings.ClientId)}" +
        $"&redirect_uri={Uri.EscapeDataString(_settings.RedirectUri)}" +
        $"&response_type=code" +
        $"&scope={Uri.EscapeDataString(Scopes)}" +
        $"&state={Uri.EscapeDataString(state)}";

    public async Task<TwitchTokenResponse> ExchangeCodeAsync(string code, CancellationToken ct = default)
    {
        var form = new Dictionary<string, string>
        {
            ["client_id"]     = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["grant_type"]    = "authorization_code",
            ["code"]          = code,
            ["redirect_uri"]  = _settings.RedirectUri,
        };
        return await PostTokenAsync(form, ct).ConfigureAwait(false);
    }

    public async Task<TwitchTokenResponse> RefreshAsync(string encryptedRefreshToken, CancellationToken ct = default)
    {
        var refreshToken = _tokenProtector.Unprotect(encryptedRefreshToken);
        var form = new Dictionary<string, string>
        {
            ["client_id"]     = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["grant_type"]    = "refresh_token",
            ["refresh_token"] = refreshToken,
        };
        return await PostTokenAsync(form, ct).ConfigureAwait(false);
    }

    public async Task RevokeAsync(string encryptedAccessToken, CancellationToken ct = default)
    {
        var token = _tokenProtector.Unprotect(encryptedAccessToken);
        var form = new Dictionary<string, string>
        {
            ["client_id"] = _settings.ClientId,
            ["token"]     = token,
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, RevokeUrl)
        {
            Content = new FormUrlEncodedContent(form),
        };
        var res = await _http.SendAsync(req, ct).ConfigureAwait(false);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException(
                $"Twitch token revoke returned {(int)res.StatusCode}");
    }

    public async Task<string> GetBroadcasterLoginAsync(string plainAccessToken, CancellationToken ct = default)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, UsersUrl);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", plainAccessToken);
        req.Headers.Add("Client-Id", _settings.ClientId);

        var res  = await _http.SendAsync(req, ct).ConfigureAwait(false);
        var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Twitch /helix/users error {res.StatusCode}: {body}");

        var dto = JsonSerializer.Deserialize<HelixUsersResponse>(body)
            ?? throw new InvalidOperationException("Empty response from Twitch /helix/users");

        var login = dto.Data.FirstOrDefault()?.Login
            ?? throw new InvalidOperationException("Twitch /helix/users returned no users");

        return login.ToLowerInvariant();
    }

    private async Task<TwitchTokenResponse> PostTokenAsync(Dictionary<string, string> form, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, TokenUrl)
        {
            Content = new FormUrlEncodedContent(form),
        };
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var res  = await _http.SendAsync(req, ct).ConfigureAwait(false);
        var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Twitch token endpoint error {res.StatusCode}: {body}");

        var dto = JsonSerializer.Deserialize<TwitchTokenDto>(body)
            ?? throw new InvalidOperationException("Empty response from Twitch token endpoint");

        return new TwitchTokenResponse(dto.AccessToken, dto.RefreshToken, dto.ExpiresIn);
    }

    private sealed class TwitchTokenDto
    {
        [JsonPropertyName("access_token")]  public string AccessToken  { get; set; } = string.Empty;
        [JsonPropertyName("refresh_token")] public string RefreshToken { get; set; } = string.Empty;
        [JsonPropertyName("expires_in")]    public int    ExpiresIn    { get; set; }
    }

    private sealed class HelixUsersResponse
    {
        [JsonPropertyName("data")] public List<HelixUserDto> Data { get; set; } = [];
    }

    private sealed class HelixUserDto
    {
        [JsonPropertyName("login")] public string Login { get; set; } = string.Empty;
    }
}
