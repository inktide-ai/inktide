using System.ComponentModel.DataAnnotations;

namespace Inktide.API.Connector.Telegram.Settings;

public sealed class TelegramSettings
{
    [Required(AllowEmptyStrings = false)]
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";

    /// <summary>Display name stored as BotUsername in the channel record.</summary>
    public string BotUsername { get; init; } = "TelegramBot";
}
