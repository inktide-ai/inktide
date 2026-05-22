using Inktide.API.Organization.Application.Entities;
using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Organization.Infrastructure.Repositories;

public sealed class OrganizationMemberRepository : IOrganizationMemberRepository
{
    private readonly OrganizationDbContext _db;

    public OrganizationMemberRepository(OrganizationDbContext db) => _db = db;

    public Task<OrganizationMember?> GetByUserIdAsync(Guid organizationId, string userId, CancellationToken ct) =>
        _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == userId, ct);

    public async Task<IReadOnlyList<OrganizationMember>> GetAllAsync(Guid organizationId, CancellationToken ct) =>
        await _db.OrganizationMembers
            .AsNoTracking()
            .Where(m => m.OrganizationId == organizationId)
            .ToListAsync(ct);

    public Task AddAsync(OrganizationMember member, CancellationToken ct)
    {
        _db.OrganizationMembers.Add(member);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
