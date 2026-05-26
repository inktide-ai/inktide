using Inktide.API.Marketplace.Domain.Entities;
using Inktide.API.Marketplace.Domain.Repositories;
using Inktide.API.Marketplace.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Inktide.API.Marketplace.Infrastructure.Repositories;

internal sealed class EfConnectorInstallationRepository(MarketplaceDbContext db) : IConnectorInstallationRepository
{
    private IQueryable<ConnectorInstallation> WithConnector
        => db.ConnectorInstallations.Include(i => i.Connector);

    public async Task<IReadOnlyList<ConnectorInstallation>> GetBySoulAsync(Guid soulId, CancellationToken ct)
        => await WithConnector
            .Where(i => i.SoulId == soulId)
            .ToListAsync(ct);

    public Task<ConnectorInstallation?> GetByIdAsync(Guid installationId, CancellationToken ct)
        => WithConnector.FirstOrDefaultAsync(i => i.Id == installationId, ct);

    public Task<ConnectorInstallation?> GetAsync(Guid soulId, Guid connectorId, CancellationToken ct)
        => WithConnector.FirstOrDefaultAsync(i => i.SoulId == soulId && i.ConnectorId == connectorId, ct);

    public async Task<ConnectorInstallation> AddAsync(ConnectorInstallation installation, CancellationToken ct)
    {
        try
        {
            db.ConnectorInstallations.Add(installation);
            await db.SaveChangesAsync(ct);
            await db.Entry(installation).Reference(i => i.Connector).LoadAsync(ct);
            return installation;
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            // Concurrent install for the same (soulId, connectorId) — return the existing row.
            // ChangeTracker.Clear() is required: without it, EF still tracks the failed entity
            // in a broken state and will throw again on the subsequent re-read.
            db.ChangeTracker.Clear();
            return await WithConnector
                .FirstAsync(
                    i => i.SoulId == installation.SoulId && i.ConnectorId == installation.ConnectorId,
                    ct);
        }
    }

    public Task RemoveAsync(Guid installationId, CancellationToken ct)
        // ExecuteDeleteAsync issues a single DELETE WHERE id = $1 without loading the entity.
        // The service layer already confirmed the row exists via GetByIdAsync; no second SELECT needed.
        => db.ConnectorInstallations
            .Where(i => i.Id == installationId)
            .ExecuteDeleteAsync(ct);

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
        => ex.InnerException is PostgresException { SqlState: "23505" };
}
