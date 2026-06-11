using Inktide.API.Core.Pagination;
using Inktide.API.Marketplace.Application.Interfaces;
using Inktide.API.Marketplace.Application.Models;
using Inktide.API.Marketplace.Domain.Entities;
using Inktide.API.Marketplace.Domain.Exceptions;
using Inktide.API.Marketplace.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Marketplace.Application.Services;

public sealed class MarketplaceService(
    IConnectorRepository connectorRepo,
    IConnectorInstallationRepository installationRepo,
    ISoulOwnershipChecker ownershipChecker,
    IConnectorEventPublisher eventPublisher,
    ILogger<MarketplaceService> logger) : IMarketplaceService
{
    public Task<IReadOnlyList<Connector>> GetConnectorsAsync(CancellationToken ct)
        => connectorRepo.GetAllAsync(ct);

    public async Task<PagedResult<Connector>> GetConnectorsPagedAsync(int limit, int offset, CancellationToken ct)
    {
        var (items, total) = await connectorRepo.GetPagedAsync(limit, offset, ct);
        var hasMore = offset + items.Count < total;
        return new PagedResult<Connector>(items, hasMore ? (offset + limit).ToString() : null, hasMore);
    }

    public Task<Connector?> GetConnectorAsync(string slug, CancellationToken ct)
        => connectorRepo.GetBySlugAsync(slug, ct);

    public async Task<InstallResult> InstallAsync(
        Guid soulId, string connectorSlug, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(connectorSlug))
            throw new InvalidConnectorSlugException(connectorSlug ?? "(null)");

        await EnsureSoulOwnershipAsync(soulId, ct);

        var connector = await connectorRepo.GetBySlugAsync(connectorSlug, ct)
            ?? throw new ConnectorNotFoundException(connectorSlug);

        if (!connector.IsAvailable)
            throw new ConnectorUnavailableException(connectorSlug);

        var existing = await installationRepo.GetAsync(soulId, connector.Id, ct);
        if (existing is not null)
        {
            logger.LogDebug(
                "Connector {ConnectorSlug} already installed for soul {SoulId}",
                connectorSlug, soulId);
            return InstallResult.Existing(existing);
        }

        logger.LogInformation(
            "Installing connector {ConnectorSlug} for soul {SoulId}", connectorSlug, soulId);

        var installation = ConnectorInstallation.Create(soulId, connector.Id);
        var result = await installationRepo.AddAsync(installation, ct);

        logger.LogInformation(
            "Connector {ConnectorSlug} installed (installation {InstallationId}) for soul {SoulId}",
            connectorSlug, result.Id, soulId);

        try
        {
            await eventPublisher.PublishInstalledAsync(result.Id, soulId, connectorSlug, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish connector.installed event for {InstallationId}", result.Id);
        }

        return InstallResult.New(result);
    }

    public async Task UninstallAsync(Guid installationId, CancellationToken ct)
    {
        var installation = await installationRepo.GetByIdAsync(installationId, ct)
            ?? throw new InstallationNotFoundException(installationId);

        await EnsureSoulOwnershipAsync(installation.SoulId, ct);

        logger.LogInformation(
            "Uninstalling installation {InstallationId} (soul {SoulId})",
            installationId, installation.SoulId);

        await installationRepo.RemoveAsync(installationId, ct);

        var connectorSlug = installation.Connector?.Slug ?? string.Empty;
        try
        {
            await eventPublisher.PublishUninstalledAsync(installationId, installation.SoulId, connectorSlug, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish connector.uninstalled event for {InstallationId}", installationId);
        }
    }

    public async Task<IReadOnlyList<ConnectorInstallation>> GetInstallationsAsync(
        Guid soulId, CancellationToken ct)
    {
        await EnsureSoulOwnershipAsync(soulId, ct);

        var installations = await installationRepo.GetBySoulAsync(soulId, ct);
        if (installations.Any(i => i.Connector is null))
            throw new InvalidOperationException(
                "GetBySoulAsync returned installations without Connector loaded. Check Include().");
        return installations;
    }

    private async Task EnsureSoulOwnershipAsync(Guid soulId, CancellationToken ct)
    {
        if (!await ownershipChecker.OwnsSoulAsync(soulId, ct))
            throw new SoulNotOwnedException(soulId);
    }
}
