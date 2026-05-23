using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Domain.Repositories;

public interface ICatalogRepository
{
    Task<IReadOnlyList<LlmCatalogEntry>> GetAvailableLlmModelsAsync(string? tier = null, CancellationToken ct = default);
    Task<LlmCatalogEntry?> GetLlmByIdAsync(Guid id, CancellationToken ct = default);
    Task<LlmCatalogEntry?> FindLlmByModelIdAsync(string modelId, CancellationToken ct = default);
    Task<IReadOnlyList<TtsCatalogEntry>> GetAvailableTtsVoicesAsync(string? tier = null, CancellationToken ct = default);
    Task<TtsCatalogEntry?> GetTtsByIdAsync(Guid id, CancellationToken ct = default);
    Task<TtsCatalogEntry?> FindTtsByVoiceIdAsync(string voiceId, CancellationToken ct = default);
}
