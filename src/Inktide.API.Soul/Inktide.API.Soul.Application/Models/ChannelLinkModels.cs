namespace Inktide.API.Soul.Application.Models;

public sealed record CreateChannelLinkCommand(
    string Platform,
    string ChannelName,
    string? ChannelId,
    string BotUsername);

public sealed record PatchChannelLinkCommand(bool IsActive);

public sealed record ChannelLink(
    Guid Id,
    string Platform,
    string ChannelName,
    string? ChannelId,
    string BotUsername,
    bool IsActive,
    DateTime? ConnectedAt,
    bool HasCustomBot = false);

public sealed record OAuthChannelUpsertCommand(
    Guid UserId,
    Guid CardId,
    string Platform,
    string ChannelId,
    string ChannelName,
    string BotUsername,
    string? AccessTokenEnc = null,
    string? RefreshTokenEnc = null,
    DateTime? TokenExpiresAt = null);
