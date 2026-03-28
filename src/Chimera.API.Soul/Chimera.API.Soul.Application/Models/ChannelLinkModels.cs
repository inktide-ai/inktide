namespace Chimera.API.Soul.Application.Models;

public sealed record CreateChannelLinkCommand(
    string Platform,
    string ChannelName,
    string? ChannelId,
    string BotUsername);

public sealed record PatchChannelLinkCommand(bool IsActive);

public sealed record ChannelLinkDto(
    Guid Id,
    string Platform,
    string ChannelName,
    string? ChannelId,
    string BotUsername,
    bool IsActive,
    DateTime? ConnectedAt);
