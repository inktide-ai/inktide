namespace Inktide.API.Organization.Application.Interfaces;

public interface IOrganizationRepository
{
    Task<Entities.Organization?> GetByOwnerIdAsync(string ownerId, CancellationToken ct = default);
    Task<Entities.Organization?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Entities.Organization org, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
