using Inktide.API.Organization.Application.Entities;
using Inktide.API.Organization.Application.Exceptions;
using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Organization.Infrastructure.Repositories;

public sealed class OrganizationRepository : IOrganizationRepository
{
    private readonly OrganizationDbContext _db;

    public OrganizationRepository(OrganizationDbContext db) => _db = db;

    public Task<Application.Entities.Organization?> GetByOwnerIdAsync(string ownerId, CancellationToken ct) =>
        _db.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.OwnerId == ownerId, ct);

    public Task<Application.Entities.Organization?> GetByIdAsync(Guid id, CancellationToken ct) =>
        _db.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, ct);

    public Task AddAsync(Application.Entities.Organization org, CancellationToken ct)
    {
        _db.Organizations.Add(org);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken ct)
    {
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("unique", StringComparison.OrdinalIgnoreCase) == true
                                           || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true)
        {
            throw new OrganizationConcurrentCreationException();
        }
    }
}
