using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Infrastructure.Services;

internal sealed class ProjectImportCatalogQueryService : IProjectImportCatalogQuery
{
    private readonly ICatalogRepository _catalog;

    public ProjectImportCatalogQueryService(ICatalogRepository catalog)
    {
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
    }

    public async Task<CatalogEntryRef?> FindLlmByModelIdAsync(string modelId, CancellationToken ct = default)
    {
        var entry = await _catalog.FindLlmByModelIdAsync(modelId, ct).ConfigureAwait(false);
        return entry is null ? null : new CatalogEntryRef(entry.Id);
    }

    public async Task<CatalogEntryRef?> FindTtsByVoiceIdAsync(string voiceId, CancellationToken ct = default)
    {
        var entry = await _catalog.FindTtsByVoiceIdAsync(voiceId, ct).ConfigureAwait(false);
        return entry is null ? null : new CatalogEntryRef(entry.Id);
    }

    public async Task<CatalogEntryRef?> GetFirstAvailableLlmAsync(CancellationToken ct = default)
    {
        var models = await _catalog.GetAvailableLlmModelsAsync(ct: ct).ConfigureAwait(false);
        var first  = models.FirstOrDefault();
        return first is null ? null : new CatalogEntryRef(first.Id);
    }
}
