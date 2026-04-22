using Chimera.API.Soul.Application.Interfaces;
using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;

namespace Chimera.API.Soul.Application.Services;

public sealed class CatalogService : ICatalogService
{

    private readonly ICatalogRepository _catalogRepo;


    public CatalogService(ICatalogRepository catalogRepo)
    {
        _catalogRepo = catalogRepo ?? throw new ArgumentNullException(nameof(catalogRepo));
    }


    public async Task<IReadOnlyList<LlmCatalogEntry>> GetAvailableLlmModelsAsync(Guid userId, CancellationToken ct = default)
    {
        return await _catalogRepo.GetAvailableLlmModelsAsync(ct: ct);
    }

    public async Task<IReadOnlyList<TtsCatalogEntry>> GetAvailableTtsVoicesAsync(Guid userId, CancellationToken ct = default)
    {
        return await _catalogRepo.GetAvailableTtsVoicesAsync(ct: ct);
    }

}
