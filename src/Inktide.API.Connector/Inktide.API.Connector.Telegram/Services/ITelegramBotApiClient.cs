namespace Inktide.API.Connector.Telegram.Services;

public interface ITelegramBotApiClient
{
    /// <summary>Calls /getMe to validate the token.
    /// Returns bot username on success, null on failure.</summary>
    Task<string?> GetBotUsernameAsync(
        string botToken, 
        CancellationToken ct = default);
    
}
