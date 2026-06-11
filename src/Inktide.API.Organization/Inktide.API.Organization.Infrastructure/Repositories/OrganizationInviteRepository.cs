using Inktide.API.Organization.Application.Entities;
using Inktide.API.Organization.Application.Enums;
using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Organization.Infrastructure.Repositories;

public sealed class OrganizationInviteRepository : IOrganizationInviteRepository
{
    private readonly OrganizationDbContext _db;

    public OrganizationInviteRepository(OrganizationDbContext db) => _db = db;

    public Task<OrganizationInvite?> GetByTokenAsync(string token, CancellationToken ct) =>
        _db.OrganizationInvites.FirstOrDefaultAsync(i => i.Token == token, ct);

    public Task<OrganizationInvite?> GetPendingByEmailAsync(Guid organizationId, string email, CancellationToken ct) =>
        _db.OrganizationInvites.FirstOrDefaultAsync(
            i => i.OrganizationId == organizationId
                 && i.Email == email
                 && i.Status == InviteStatus.Pending,
            ct);

    public Task<OrganizationInvite?> GetPendingByIdTrackedAsync(Guid inviteId, CancellationToken ct) =>
        _db.OrganizationInvites.FirstOrDefaultAsync(
            i => i.Id == inviteId && i.Status == InviteStatus.Pending, ct);

    public async Task<IReadOnlyList<OrganizationInvite>> GetPendingByOrganizationAsync(Guid organizationId, CancellationToken ct) =>
        await _db.OrganizationInvites
            .AsNoTracking()
            .Where(i => i.OrganizationId == organizationId && i.Status == InviteStatus.Pending)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<OrganizationInvite>> GetPendingByOrganizationTrackedAsync(Guid organizationId, CancellationToken ct) =>
        await _db.OrganizationInvites
            .Where(i => i.OrganizationId == organizationId && i.Status == InviteStatus.Pending)
            .ToListAsync(ct);

    public Task AddAsync(OrganizationInvite invite, CancellationToken ct)
    {
        _db.OrganizationInvites.Add(invite);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
