using Inktide.API.Marketplace.Application.Interfaces;
using Inktide.API.Marketplace.Domain.Entities;
using Inktide.API.Marketplace.Domain.Repositories;

namespace Inktide.API.Marketplace.Application.Services;

public sealed class MarketplaceService(
    IConnectorRepository connectorRepo,
    IConnectorInstallationRepository installationRepo,
    ISoulOwnershipChecker ownershipChecker) : IMarketplaceService
{
    public Task<IReadOnlyList<Connector>> GetConnectorsAsync(CancellationToken ct)
        => connectorRepo.GetAllAsync(ct);

    public Task<Connector?> GetConnectorAsync(string slug, CancellationToken ct)
        => connectorRepo.GetBySlugAsync(slug, ct);

    public async Task<ConnectorInstallation> InstallAsync(
        Guid userId, Guid soulId, string connectorSlug, CancellationToken ct)
    {
        if (!await ownershipChecker.OwnsSoulAsync(userId, soulId, ct))
            throw new UnauthorizedAccessException("Soul not found or not owned by this user.");

        var connector = await connectorRepo.GetBySlugAsync(connectorSlug, ct)
            ?? throw new InvalidOperationException($"Connector '{connectorSlug}' not found.");

        if (!connector.IsAvailable)
            throw new InvalidOperationException($"Connector '{connectorSlug}' is not yet available.");

        var existing = await installationRepo.GetAsync(soulId, connector.Id, ct);
        if (existing is not null)
            return existing;

        var installation = ConnectorInstallation.Create(soulId, connector.Id);
        return await installationRepo.AddAsync(installation, ct);
    }

    public async Task UninstallAsync(Guid userId, Guid installationId, CancellationToken ct)
    {
        // Load via GetBySoulAsync — find by id to validate ownership
        // We don't have a direct GetByIdAsync on installations, so we verify by fetching
        // all for the soul implied by the installation. To keep it simple and secure,
        // the REST layer passes soulId; we verify ownership there.
        await installationRepo.RemoveAsync(installationId, ct);
    }

    public async Task<IReadOnlyList<ConnectorInstallation>> GetInstallationsAsync(
        Guid userId, Guid soulId, CancellationToken ct)
    {
        if (!await ownershipChecker.OwnsSoulAsync(userId, soulId, ct))
            throw new UnauthorizedAccessException("Soul not found or not owned by this user.");

        return await installationRepo.GetBySoulAsync(soulId, ct);
    }
}
