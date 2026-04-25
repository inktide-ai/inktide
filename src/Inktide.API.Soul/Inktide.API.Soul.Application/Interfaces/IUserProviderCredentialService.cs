using Inktide.API.Soul.Application.Models;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IUserProviderCredentialService
{
    Task<IReadOnlyList<UserProviderCredentialSummary>> GetAllAsync(Guid userId, CancellationToken ct = default);
    Task UpsertAsync(Guid userId, string providerId, string apiKey, string? baseUrl, string? config = null, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, string providerId, CancellationToken ct = default);

    /// <summary>
    /// Returns the decrypted API key + base URL for the given user/provider pair.
    /// Returns null if no credential is configured.
    /// Called by LlmStreamWorker via IServiceScopeFactory — key is never serialised to Redis.
    /// </summary>
    Task<DecryptedCredential?> GetDecryptedAsync(Guid userId, string providerId, CancellationToken ct = default);
}
