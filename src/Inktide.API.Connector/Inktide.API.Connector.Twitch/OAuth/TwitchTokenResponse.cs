namespace Inktide.API.Connector.Twitch.OAuth;

public sealed record TwitchTokenResponse(
    string AccessToken,
    string RefreshToken,
    int    ExpiresIn);
