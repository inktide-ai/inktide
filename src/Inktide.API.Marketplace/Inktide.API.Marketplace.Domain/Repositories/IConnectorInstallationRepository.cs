using Inktide.API.Marketplace.Domain.Entities;

namespace Inktide.API.Marketplace.Domain.Repositories;

public interface IConnectorInstallationRepository
{
    Task<IReadOnlyList<ConnectorInstallation>> GetBySoulAsync(Guid soulId, CancellationToken ct);
    Task<ConnectorInstallation?> GetAsync(Guid soulId, Guid connectorId, CancellationToken ct);
    Task<ConnectorInstallation> AddAsync(ConnectorInstallation installation, CancellationToken ct);
    Task RemoveAsync(Guid installationId, CancellationToken ct);
}
