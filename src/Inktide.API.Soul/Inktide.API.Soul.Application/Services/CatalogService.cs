using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Application.Services;

public sealed class CatalogService : ICatalogService
{

    private readonly ICatalogRepository _catalogRepo;


    public CatalogService(ICatalogRepository catalogRepo)
    {
        _catalogRepo = catalogRepo ?? throw new ArgumentNullException(nameof(catalogRepo));
    }


    public async Task<IReadOnlyList<LlmCatalogEntry>> GetAvailableLlmModelsAsync(CancellationToken ct = default)
    {
        return await _catalogRepo.GetAvailableLlmModelsAsync(ct: ct);
    }

    public async Task<IReadOnlyList<TtsCatalogEntry>> GetAvailableTtsVoicesAsync(CancellationToken ct = default)
    {
        return await _catalogRepo.GetAvailableTtsVoicesAsync(ct: ct);
    }

}
