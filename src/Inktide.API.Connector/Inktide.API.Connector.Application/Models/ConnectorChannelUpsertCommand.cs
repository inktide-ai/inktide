namespace Inktide.API.Connector.Application.Models;

public sealed record ConnectorChannelUpsertCommand(
    Guid UserId,
    Guid CardId,
    string Platform,
    string ChannelId,
    string ChannelName,
    string BotUsername,
    string? AccessTokenEnc = null,
    string? RefreshTokenEnc = null,
    DateTime? TokenExpiresAt = null);
