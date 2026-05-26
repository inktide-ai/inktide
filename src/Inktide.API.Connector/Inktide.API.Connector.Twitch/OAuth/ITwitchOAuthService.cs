namespace Inktide.API.Connector.Twitch.OAuth;

public interface ITwitchOAuthService
{
    string BuildInstallUrl(string state);
    Task<TwitchTokenResponse> ExchangeCodeAsync(string code, CancellationToken ct = default);
    Task<TwitchTokenResponse> RefreshAsync(string encryptedRefreshToken, CancellationToken ct = default);
    Task RevokeAsync(string encryptedAccessToken, CancellationToken ct = default);
    /// <summary>Calls GET /helix/users and returns the broadcaster's login in lowercase.</summary>
    Task<string> GetBroadcasterLoginAsync(string plainAccessToken, CancellationToken ct = default);
}
