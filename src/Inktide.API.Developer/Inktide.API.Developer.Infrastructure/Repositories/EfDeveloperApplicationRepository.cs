using Inktide.API.Developer.Domain.Entities;
using Inktide.API.Developer.Domain.Repositories;
using Inktide.API.Developer.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Developer.Infrastructure.Repositories;

internal sealed class EfDeveloperApplicationRepository(DeveloperDbContext db) : IDeveloperApplicationRepository
{
    public Task<DeveloperApplication?> FindByIdAsync(Guid id, CancellationToken ct) =>
        db.Applications.FirstOrDefaultAsync(a => a.Id == id, ct);

    public Task<DeveloperApplication?> FindByKeycloakClientIdAsync(string keycloakClientId, CancellationToken ct) =>
        db.Applications.FirstOrDefaultAsync(a => a.KeycloakClientId == keycloakClientId, ct);

    public async Task<IReadOnlyList<DeveloperApplication>> GetByOwnerAsync(string ownerUserId, CancellationToken ct) =>
        await db.Applications
            .Where(a => a.OwnerUserId == ownerUserId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<DeveloperApplication>> GetByConnectorSlugAsync(string connectorSlug, CancellationToken ct) =>
        await db.Applications
            .Where(a => a.ConnectorSlug == connectorSlug && a.WebhookUrl != null)
            .ToListAsync(ct);

    public async Task AddAsync(DeveloperApplication app, CancellationToken ct)
    {
        db.Applications.Add(app);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(DeveloperApplication app, CancellationToken ct)
    {
        db.Applications.Update(app);
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(DeveloperApplication app, CancellationToken ct)
    {
        db.Applications.Remove(app);
        await db.SaveChangesAsync(ct);
    }
}
