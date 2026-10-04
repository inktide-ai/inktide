using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.Queries;

/// <summary>
/// Fetches all data required by <see cref="Guards.SoulCreationGuard"/>.
/// The repositories share one scoped DbContext, which does not support concurrent operations,
/// so the lookups run one after another.
/// </summary>
public sealed class SoulCreationValidationQueryService
{
    private readonly ICatalogRepository _catalog;
    private readonly IUserProviderCredentialService _credentials;
    private readonly IUserProviderCredentialRepository _credRepo;

    public SoulCreationValidationQueryService(
        ICatalogRepository catalog,
        IUserProviderCredentialService credentials,
        IUserProviderCredentialRepository credRepo)
    {
        _catalog     = catalog     ?? throw new ArgumentNullException(nameof(catalog));
        _credentials = credentials ?? throw new ArgumentNullException(nameof(credentials));
        _credRepo    = credRepo    ?? throw new ArgumentNullException(nameof(credRepo));
    }

    public async Task<SoulCreationValidationData> GetValidationDataAsync(
        Guid userId,
        Guid llmCatalogId,
        Guid? ttsCatalogId,
        CancellationToken ct)
    {
        var llmEntry = await _catalog.GetLlmByIdAsync(llmCatalogId, ct).ConfigureAwait(false);
        var ttsEntry = ttsCatalogId.HasValue
            ? await _catalog.GetTtsByIdAsync(ttsCatalogId.Value, ct).ConfigureAwait(false)
            : null;

        // Credential lookups only for providers that need an API key.
        Models.DecryptedCredential? llmCred = null;
        Domain.Entities.UserProviderCredential? llmCredEntity = null;
        if (llmEntry?.RequiresApiKey == true)
        {
            llmCred       = await _credentials.GetDecryptedAsync(userId, llmEntry.Provider, ct).ConfigureAwait(false);
            llmCredEntity = await _credRepo.GetByUserAndProviderAsync(userId, llmEntry.Provider, ct).ConfigureAwait(false);
        }

        Models.DecryptedCredential? ttsCred = null;
        Domain.Entities.UserProviderCredential? ttsCredEntity = null;
        if (ttsEntry?.RequiresApiKey == true)
        {
            ttsCred       = await _credentials.GetDecryptedAsync(userId, ttsEntry.Provider, ct).ConfigureAwait(false);
            ttsCredEntity = await _credRepo.GetByUserAndProviderAsync(userId, ttsEntry.Provider, ct).ConfigureAwait(false);
        }

        return new SoulCreationValidationData(
            LlmEntry:         llmEntry,
            TtsEntry:         ttsEntry,
            LlmDecryptedCred: llmCred,
            LlmCredEntity:    llmCredEntity,
            TtsDecryptedCred: ttsCred,
            TtsCredEntity:    ttsCredEntity);
    }
}
