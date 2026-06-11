using Inktide.API.Core.Pagination;
using Inktide.API.Marketplace.Application.Models;
using Inktide.API.Marketplace.Domain.Entities;

namespace Inktide.API.Marketplace.Application.Interfaces;

public interface IMarketplaceService
{
    Task<IReadOnlyList<Connector>> GetConnectorsAsync(CancellationToken ct);
    Task<PagedResult<Connector>> GetConnectorsPagedAsync(int limit, int offset, CancellationToken ct);
    Task<Connector?> GetConnectorAsync(string slug, CancellationToken ct);
    Task<InstallResult> InstallAsync(Guid soulId, string connectorSlug, CancellationToken ct);
    Task UninstallAsync(Guid installationId, CancellationToken ct);
    Task<IReadOnlyList<ConnectorInstallation>> GetInstallationsAsync(Guid soulId, CancellationToken ct);
}
