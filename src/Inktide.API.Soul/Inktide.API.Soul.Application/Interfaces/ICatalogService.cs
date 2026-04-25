using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

public interface ICatalogService
{
    Task<IReadOnlyList<LlmCatalogEntry>> GetAvailableLlmModelsAsync(
        Guid userId,
        CancellationToken ct = default);
    
    Task<IReadOnlyList<TtsCatalogEntry>> GetAvailableTtsVoicesAsync(
        Guid userId,
        CancellationToken ct = default);
    
}
