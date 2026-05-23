using Inktide.API.Organization.Application.Entities;

namespace Inktide.API.Organization.Application.Interfaces;

public interface IOrganizationMemberRepository
{
    Task<OrganizationMember?> GetByUserIdAsync(Guid organizationId, string userId, CancellationToken ct = default);
    Task<IReadOnlyList<OrganizationMember>> GetAllAsync(Guid organizationId, CancellationToken ct = default);
    Task AddAsync(OrganizationMember member, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
