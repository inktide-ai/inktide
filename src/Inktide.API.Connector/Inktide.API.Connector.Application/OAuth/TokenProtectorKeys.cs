namespace Inktide.API.Connector.Application.OAuth;

/// <summary>
/// Typed constants for keyed-DI registration and injection of <see cref="ITokenProtector"/>.
/// Using constants avoids magic strings at both registration site and <c>[FromKeyedServices]</c>
/// call sites — a typo is a compile-time error rather than a runtime <see cref="InvalidOperationException"/>.
/// </summary>
public static class TokenProtectorKeys
{
    public const string Discord  = "discord";
    public const string Twitch   = "twitch";
    public const string Telegram = "telegram";
}
