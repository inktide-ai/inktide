using Inktide.API.Developer.Domain.Entities;

namespace Inktide.API.Developer.Domain.Repositories;

public interface IDeveloperApplicationRepository
{
    Task<DeveloperApplication?> FindByIdAsync(Guid id, CancellationToken ct);
    Task<DeveloperApplication?> FindByKeycloakClientIdAsync(string keycloakClientId, CancellationToken ct);
    Task<IReadOnlyList<DeveloperApplication>> GetByOwnerAsync(string ownerUserId, CancellationToken ct);
    Task<IReadOnlyList<DeveloperApplication>> GetByConnectorSlugAsync(string connectorSlug, CancellationToken ct);
    Task AddAsync(DeveloperApplication app, CancellationToken ct);
    Task UpdateAsync(DeveloperApplication app, CancellationToken ct);
    Task DeleteAsync(DeveloperApplication app, CancellationToken ct);
}
