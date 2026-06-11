namespace Inktide.API.Connector.Application.Models;

public sealed record ConnectorChannelInfo(
    Guid Id,
    Guid AiCardId,
    string? ChannelId,
    string Platform,
    bool IsActive,
    string? OAuthTokenEnc);
