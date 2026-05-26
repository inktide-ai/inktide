namespace Inktide.API.Connector.Discord.OAuth;

public sealed record DiscordTokenResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string GuildId,
    string GuildName);

public interface IDiscordOAuthService
{
    string BuildInstallUrl(string state);
    Task<DiscordTokenResponse> ExchangeCodeAsync(string code, CancellationToken ct = default);
    Task<DiscordTokenResponse> RefreshAsync(string encryptedRefreshToken, CancellationToken ct = default);
    Task RevokeAsync(string encryptedAccessToken, CancellationToken ct = default);
}
