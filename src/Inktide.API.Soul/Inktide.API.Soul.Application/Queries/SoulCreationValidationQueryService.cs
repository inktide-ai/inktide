using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.Queries;

/// <summary>
/// Fetches all data required by <see cref="Guards.SoulCreationGuard"/> in two parallel rounds
/// instead of up to six sequential DB calls.
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
        // Round 1: catalog lookups in parallel.
        var llmTask = _catalog.GetLlmByIdAsync(llmCatalogId, ct);
        var ttsTask = ttsCatalogId.HasValue
            ? _catalog.GetTtsByIdAsync(ttsCatalogId.Value, ct)
            : Task.FromResult<Domain.Entities.TtsCatalogEntry?>(null);

        await Task.WhenAll(llmTask, ttsTask).ConfigureAwait(false);

        var llmEntry = await llmTask;
        var ttsEntry = await ttsTask;

        // Round 2: credential lookups in parallel (only for providers that need an API key).
        var llmCredTask       = llmEntry?.RequiresApiKey == true
            ? _credentials.GetDecryptedAsync(userId, llmEntry.Provider, ct)
            : Task.FromResult<Models.DecryptedCredential?>(null);

        var llmCredEntityTask = llmEntry?.RequiresApiKey == true
            ? _credRepo.GetByUserAndProviderAsync(userId, llmEntry.Provider, ct)
            : Task.FromResult<Domain.Entities.UserProviderCredential?>(null);

        var ttsCredTask       = ttsEntry?.RequiresApiKey == true
            ? _credentials.GetDecryptedAsync(userId, ttsEntry.Provider, ct)
            : Task.FromResult<Models.DecryptedCredential?>(null);

        var ttsCredEntityTask = ttsEntry?.RequiresApiKey == true
            ? _credRepo.GetByUserAndProviderAsync(userId, ttsEntry.Provider, ct)
            : Task.FromResult<Domain.Entities.UserProviderCredential?>(null);

        await Task.WhenAll(llmCredTask, llmCredEntityTask, ttsCredTask, ttsCredEntityTask)
                  .ConfigureAwait(false);

        return new SoulCreationValidationData(
            LlmEntry:        llmEntry,
            TtsEntry:        ttsEntry,
            LlmDecryptedCred: await llmCredTask,
            LlmCredEntity:   await llmCredEntityTask,
            TtsDecryptedCred: await ttsCredTask,
            TtsCredEntity:   await ttsCredEntityTask);
    }
}
