using Inktide.API.Marketplace.Domain.Entities;
using Inktide.API.Marketplace.Domain.Repositories;
using Inktide.API.Marketplace.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Marketplace.Infrastructure.Repositories;

internal sealed class EfConnectorInstallationRepository(MarketplaceDbContext db) : IConnectorInstallationRepository
{
    public async Task<IReadOnlyList<ConnectorInstallation>> GetBySoulAsync(Guid soulId, CancellationToken ct)
        => await db.ConnectorInstallations
            .Include(i => i.Connector)
            .Where(i => i.SoulId == soulId)
            .ToListAsync(ct);

    public Task<ConnectorInstallation?> GetAsync(Guid soulId, Guid connectorId, CancellationToken ct)
        => db.ConnectorInstallations
            .Include(i => i.Connector)
            .FirstOrDefaultAsync(i => i.SoulId == soulId && i.ConnectorId == connectorId, ct);

    public async Task<ConnectorInstallation> AddAsync(ConnectorInstallation installation, CancellationToken ct)
    {
        db.ConnectorInstallations.Add(installation);
        await db.SaveChangesAsync(ct);
        await db.Entry(installation).Reference(i => i.Connector).LoadAsync(ct);
        return installation;
    }

    public async Task RemoveAsync(Guid installationId, CancellationToken ct)
    {
        var row = await db.ConnectorInstallations.FindAsync([installationId], ct);
        if (row is not null)
        {
            db.ConnectorInstallations.Remove(row);
            await db.SaveChangesAsync(ct);
        }
    }
}
