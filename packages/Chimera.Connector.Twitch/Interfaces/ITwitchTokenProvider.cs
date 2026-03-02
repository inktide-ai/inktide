namespace Chimera.ApiGateway.Twitch.Auth;

/// <summary>
/// Provides a valid Twitch access token.
/// Implementations may cache, auto-refresh, or return a pre-configured token.
/// </summary>
public interface ITwitchTokenProvider
{
    Task<string> GetAccessTokenAsync(CancellationToken ct = default);
}
