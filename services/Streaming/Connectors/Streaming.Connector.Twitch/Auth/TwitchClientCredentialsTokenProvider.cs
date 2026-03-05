using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Chimera.ApiGateway.Twitch.Settings;

namespace Chimera.ApiGateway.Twitch.Auth;

/// <summary>
/// Obtains App Access Token via OAuth2 Client Credentials flow and caches it
/// until it expires (with a safety margin).
/// </summary>
public sealed class TwitchClientCredentialsTokenProvider : ITwitchTokenProvider
{
    private const string TokenEndpoint = "https://id.twitch.tv/oauth2/token";
    private static readonly TimeSpan ExpiryMargin = TimeSpan.FromMinutes(5);

    private readonly TwitchSettings _settings;
    private readonly ILogger<TwitchClientCredentialsTokenProvider> _logger;
    private readonly HttpClient _httpClient = new();
    private readonly SemaphoreSlim _lock = new(1, 1);

    private string? _cachedToken;
    private DateTimeOffset _expiresAt = DateTimeOffset.MinValue;

    public TwitchClientCredentialsTokenProvider(
        IOptions<TwitchSettings> settings,
        ILogger<TwitchClientCredentialsTokenProvider> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<string> GetAccessTokenAsync(CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(_settings.AccessToken)) {
            return _settings.AccessToken;
        }

        if (_cachedToken is not null && DateTimeOffset.UtcNow < _expiresAt) {
            return _cachedToken;
        }

        await _lock.WaitAsync(ct);
        try
        {
            if (_cachedToken is not null && DateTimeOffset.UtcNow < _expiresAt) {
                return _cachedToken;
            }

            _logger.LogInformation("Requesting new Twitch App Access Token via Client Credentials flow");

            var body = new FormUrlEncodedContent([
                new KeyValuePair<string, string>("client_id", _settings.ClientId),
                new KeyValuePair<string, string>("client_secret", _settings.ClientSecret),
                new KeyValuePair<string, string>("grant_type", "client_credentials")
            ]);

            var response = await _httpClient.PostAsync(TokenEndpoint, body, ct);
            response.EnsureSuccessStatusCode();

            var token = await response.Content.ReadFromJsonAsync<TokenResponse>(ct)
                        ?? throw new InvalidOperationException("Twitch OAuth returned null response");

            _cachedToken = token.AccessToken;
            _expiresAt = DateTimeOffset.UtcNow.AddSeconds(token.ExpiresIn) - ExpiryMargin;

            _logger.LogInformation(
                "Twitch App Access Token obtained, expires at {ExpiresAt:u}",
                _expiresAt);

            return _cachedToken;
        }
        finally
        {
            _lock.Release();
        }
    }

    private sealed class TokenResponse
    {
        private string _accessToken = string.Empty;
        private int _expiresIn;
        private string _tokenType = string.Empty;

        [JsonPropertyName("access_token")]
        public string AccessToken
        {
            get => _accessToken;
            set => _accessToken = value;
        }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn
        {
            get => _expiresIn;
            set => _expiresIn = value;
        }

        [JsonPropertyName("token_type")]
        public string TokenType
        {
            get => _tokenType;
            set => _tokenType = value;
        }
    }
}
