using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Connector.Application.OAuth;
using Inktide.API.Connector.Discord.Settings;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Discord.OAuth;

public sealed class DiscordOAuthService : IDiscordOAuthService
{
    private const string DiscordTokenUrl = "https://discord.com/api/oauth2/token";
    private const string DiscordRevokeUrl = "https://discord.com/api/oauth2/token/revoke";
    private const string Scopes = "bot identify guilds.join";
    private const int Permissions = 84992; // VIEW_CHANNEL + SEND_MESSAGES + READ_MESSAGE_HISTORY + EMBED_LINKS

    private readonly DiscordSettings _settings;
    private readonly ITokenProtector _tokenProtector;
    private readonly HttpClient _http;

    public DiscordOAuthService(
        IOptions<DiscordSettings> settings,
        [FromKeyedServices(TokenProtectorKeys.Discord)] ITokenProtector tokenProtector,
        HttpClient http)
    {
        _settings       = settings.Value;
        _tokenProtector = tokenProtector;
        _http           = http;
    }

    public string BuildInstallUrl(string state) =>
        $"https://discord.com/api/oauth2/authorize" +
        $"?client_id={Uri.EscapeDataString(_settings.ClientId)}" +
        $"&redirect_uri={Uri.EscapeDataString(_settings.RedirectUri)}" +
        $"&response_type=code" +
        $"&scope={Uri.EscapeDataString(Scopes)}" +
        $"&permissions={Permissions}" +
        $"&state={Uri.EscapeDataString(state)}" +
        $"&guild_select=true";

    public async Task<DiscordTokenResponse> ExchangeCodeAsync(string code, CancellationToken ct = default)
    {
        var form = new Dictionary<string, string>
        {
            ["client_id"]     = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["grant_type"]    = "authorization_code",
            ["code"]          = code,
            ["redirect_uri"]  = _settings.RedirectUri,
        };
        return await PostTokenAsync(form, ct);
    }

    public async Task<DiscordTokenResponse> RefreshAsync(string encryptedRefreshToken, CancellationToken ct = default)
    {
        var refreshToken = _tokenProtector.Unprotect(encryptedRefreshToken);
        var form = new Dictionary<string, string>
        {
            ["client_id"]     = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["grant_type"]    = "refresh_token",
            ["refresh_token"] = refreshToken,
        };
        return await PostTokenAsync(form, ct);
    }

    public async Task RevokeAsync(string encryptedAccessToken, CancellationToken ct = default)
    {
        var token = _tokenProtector.Unprotect(encryptedAccessToken);
        var form = new Dictionary<string, string>
        {
            ["client_id"]     = _settings.ClientId,
            ["client_secret"] = _settings.ClientSecret,
            ["token"]         = token,
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, DiscordRevokeUrl)
        {
            Content = new FormUrlEncodedContent(form),
        };
        var res = await _http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException(
                $"Discord token revoke returned {(int)res.StatusCode}");
    }

    private async Task<DiscordTokenResponse> PostTokenAsync(
        Dictionary<string, string> form,
        CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, DiscordTokenUrl)
        {
            Content = new FormUrlEncodedContent(form),
        };
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Discord token endpoint error {res.StatusCode}: {body}");

        var dto = JsonSerializer.Deserialize<DiscordTokenDto>(body)
            ?? throw new InvalidOperationException("Empty response from Discord token endpoint");

        return new DiscordTokenResponse(
            dto.AccessToken,
            dto.RefreshToken,
            dto.ExpiresIn,
            dto.Guild?.Id ?? string.Empty,
            dto.Guild?.Name ?? string.Empty);
    }

    private sealed class DiscordTokenDto
    {
        [JsonPropertyName("access_token")]  public string AccessToken  { get; set; } = string.Empty;
        [JsonPropertyName("refresh_token")] public string RefreshToken { get; set; } = string.Empty;
        [JsonPropertyName("expires_in")]    public int    ExpiresIn    { get; set; }
        [JsonPropertyName("guild")]         public GuildDto? Guild     { get; set; }
    }

    private sealed class GuildDto
    {
        [JsonPropertyName("id")]   public string Id   { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    }
}
