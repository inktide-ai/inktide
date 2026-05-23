using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class CatalogRepository : ICatalogRepository
{

    private readonly SoulDbContext _db;


    public CatalogRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public async Task<IReadOnlyList<LlmCatalogEntry>> GetAvailableLlmModelsAsync(string? tier = null, CancellationToken ct = default)
    {
        var query = _db.LlmCatalog.AsNoTracking().Where(m => m.IsAvailable);
        if (tier is not null)
            query = query.Where(m => m.Tier == tier);
        return await query.OrderBy(m => m.Provider).ThenBy(m => m.DisplayName).ToListAsync(ct);
    }

    public async Task<LlmCatalogEntry?> GetLlmByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.LlmCatalog.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, ct);
    }

    public async Task<IReadOnlyList<TtsCatalogEntry>> GetAvailableTtsVoicesAsync(string? tier = null, CancellationToken ct = default)
    {
        var query = _db.TtsCatalog.AsNoTracking().Where(v => v.IsAvailable);
        if (tier is not null)
            query = query.Where(v => v.Tier == tier);
        return await query.OrderBy(v => v.Provider).ThenBy(v => v.DisplayName).ToListAsync(ct);
    }

    public async Task<TtsCatalogEntry?> GetTtsByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.TtsCatalog.AsNoTracking().FirstOrDefaultAsync(v => v.Id == id, ct);
    }

    public async Task<LlmCatalogEntry?> FindLlmByModelIdAsync(string modelId, CancellationToken ct = default)
    {
        return await _db.LlmCatalog.AsNoTracking()
            .FirstOrDefaultAsync(m => m.ModelId == modelId && m.IsAvailable, ct);
    }

    public async Task<TtsCatalogEntry?> FindTtsByVoiceIdAsync(string voiceId, CancellationToken ct = default)
    {
        return await _db.TtsCatalog.AsNoTracking()
            .FirstOrDefaultAsync(v => v.VoiceId == voiceId && v.IsAvailable, ct);
    }

}
