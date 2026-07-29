using System.ComponentModel.DataAnnotations;

namespace Inktide.API.Connector.Twitch.Settings;

public sealed class TwitchSettings
{
    [Required] public string ClientId        { get; init; } = string.Empty;
    [Required] public string ClientSecret    { get; init; } = string.Empty;
    /// <summary>IRC OAuth token for the bot account. Sourced exclusively from .env - never appsettings.json.</summary>
    [Required] public string BotOAuthToken   { get; init; } = string.Empty;
    [Required] public string BotUsername     { get; init; } = string.Empty;
    [Required] public string RedirectUri     { get; init; } = string.Empty;
    [Required] public string FrontendBaseUrl { get; init; } = string.Empty;
}
