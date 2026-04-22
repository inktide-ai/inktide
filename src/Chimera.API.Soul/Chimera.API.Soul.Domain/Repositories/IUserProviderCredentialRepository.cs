using Chimera.API.Soul.Domain.Entities;

namespace Chimera.API.Soul.Domain.Repositories;

public interface IUserProviderCredentialRepository
{
    Task<IReadOnlyList<UserProviderCredential>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<UserProviderCredential?> GetByUserAndProviderAsync(Guid userId, string providerId, CancellationToken ct = default);
    Task<UserProviderCredential> UpsertAsync(UserProviderCredential credential, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, string providerId, CancellationToken ct = default);
}
