using Inktide.API.Marketplace.Domain.Entities;
using Inktide.API.Marketplace.Domain.Repositories;
using Inktide.API.Marketplace.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Marketplace.Infrastructure.Repositories;

internal sealed class EfConnectorRepository(MarketplaceDbContext db) : IConnectorRepository
{
    public async Task<IReadOnlyList<Connector>> GetAllAsync(CancellationToken ct)
        => await db.Connectors.OrderBy(c => c.SortOrder).ToListAsync(ct);

    public Task<Connector?> GetBySlugAsync(string slug, CancellationToken ct)
        => db.Connectors.FirstOrDefaultAsync(c => c.Slug == slug, ct);

    public async Task<(IReadOnlyList<Connector> Items, int Total)> GetPagedAsync(
        int limit, int offset, CancellationToken ct)
    {
        var total = await db.Connectors.CountAsync(ct);
        var items = await db.Connectors
            .OrderBy(c => c.SortOrder)
            .Skip(offset)
            .Take(limit)
            .ToListAsync(ct);
        return (items, total);
    }
}
