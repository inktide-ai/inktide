using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

public interface ICatalogService
{
    Task<IReadOnlyList<LlmCatalogEntry>> GetAvailableLlmModelsAsync(CancellationToken ct = default);

    Task<IReadOnlyList<TtsCatalogEntry>> GetAvailableTtsVoicesAsync(CancellationToken ct = default);
}
