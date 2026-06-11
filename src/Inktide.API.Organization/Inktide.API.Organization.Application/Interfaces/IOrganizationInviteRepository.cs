using Inktide.API.Organization.Application.Entities;

namespace Inktide.API.Organization.Application.Interfaces;

public interface IOrganizationInviteRepository
{
    Task<OrganizationInvite?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<OrganizationInvite?> GetPendingByEmailAsync(Guid organizationId, string email, CancellationToken ct = default);
    Task<IReadOnlyList<OrganizationInvite>> GetPendingByOrganizationAsync(Guid organizationId, CancellationToken ct = default);
    Task<IReadOnlyList<OrganizationInvite>> GetPendingByOrganizationTrackedAsync(Guid organizationId, CancellationToken ct = default);
    Task<OrganizationInvite?> GetPendingByIdTrackedAsync(Guid inviteId, CancellationToken ct = default);
    Task AddAsync(OrganizationInvite invite, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
