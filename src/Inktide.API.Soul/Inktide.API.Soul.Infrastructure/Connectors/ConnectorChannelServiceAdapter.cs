using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Connector.Application.Models;

namespace Inktide.API.Soul.Infrastructure.Connectors;

/// <summary>
/// Stub adapter - AiCardChannel has moved to the Project context.
/// This class keeps the DI registration compiling while the migration is in progress.
/// TODO: replace with a Project-context implementation once Project owns channels.
/// </summary>
internal sealed class ConnectorChannelServiceAdapter : IConnectorChannelService
{
    public Task<Guid> UpsertAsync(ConnectorChannelUpsertCommand cmd, CancellationToken ct = default)
        => Task.FromResult(Guid.Empty);

    public Task<ConnectorChannelInfo?> GetByIdAsync(Guid userId, Guid channelId, CancellationToken ct = default)
        => Task.FromResult<ConnectorChannelInfo?>(null);

    public Task<bool> DeactivateAsync(Guid userId, Guid channelId, CancellationToken ct = default)
        => Task.FromResult(false);

    public Task<bool> SetCustomBotTokenAsync(Guid userId, Guid channelId, string? encryptedToken, CancellationToken ct = default)
        => Task.FromResult(false);

    public Task<IReadOnlyList<ConnectorChannelInfo>> GetActivePlatformChannelsAsync(string platform, CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<ConnectorChannelInfo>>([]);

    public Task<IReadOnlyList<ConnectorChannelInfo>> GetByCardIdAsync(Guid cardId, CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<ConnectorChannelInfo>>([]);
}
