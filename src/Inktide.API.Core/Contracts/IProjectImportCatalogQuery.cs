namespace Inktide.API.Core.Contracts;

public interface IProjectImportCatalogQuery
{
    Task<CatalogEntryRef?> FindLlmByModelIdAsync(string modelId, CancellationToken ct = default);
    Task<CatalogEntryRef?> FindTtsByVoiceIdAsync(string voiceId, CancellationToken ct = default);
    Task<CatalogEntryRef?> GetFirstAvailableLlmAsync(CancellationToken ct = default);
}

public sealed record CatalogEntryRef(Guid Id);
