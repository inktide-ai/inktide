using Inktide.API.Marketplace.Domain.Entities;

namespace Inktide.API.Marketplace.Application.Interfaces;

public interface IMarketplaceService
{
    Task<IReadOnlyList<Connector>> GetConnectorsAsync(CancellationToken ct);
    Task<Connector?> GetConnectorAsync(string slug, CancellationToken ct);
    Task<ConnectorInstallation> InstallAsync(Guid userId, Guid soulId, string connectorSlug, CancellationToken ct);
    Task UninstallAsync(Guid userId, Guid installationId, CancellationToken ct);
    Task<IReadOnlyList<ConnectorInstallation>> GetInstallationsAsync(Guid userId, Guid soulId, CancellationToken ct);
}
