using Inktide.API.Connector.Application.Models;

namespace Inktide.API.Connector.Application.Interfaces;

public interface IConnectorChannelService
{
    Task<Guid> UpsertAsync(ConnectorChannelUpsertCommand cmd, CancellationToken ct = default);
    Task<ConnectorChannelInfo?> GetByIdAsync(Guid userId, Guid channelId, CancellationToken ct = default);
    Task<bool> DeactivateAsync(Guid userId, Guid channelId, CancellationToken ct = default);
    Task<bool> SetCustomBotTokenAsync(Guid userId, Guid channelId, string? encryptedToken, CancellationToken ct = default);
    Task<IReadOnlyList<ConnectorChannelInfo>> GetActivePlatformChannelsAsync(string platform, CancellationToken ct = default);
    Task<IReadOnlyList<ConnectorChannelInfo>> GetByCardIdAsync(Guid cardId, CancellationToken ct = default);
}
