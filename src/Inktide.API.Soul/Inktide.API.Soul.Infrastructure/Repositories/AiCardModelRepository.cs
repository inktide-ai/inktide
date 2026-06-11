using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class AiCardModelRepository : IAiCardModelRepository
{

    private readonly SoulDbContext _db;


    public AiCardModelRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public Task<AiCardModel> AddAsync(AiCardModel model, CancellationToken ct = default)
    {
        _db.AiCardModels.Add(model);
        return Task.FromResult(model);
    }

    public async Task<IReadOnlyList<AiCardModel>> ListByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardModels
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.AiCardId == aiCardId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<AiCardModel?> GetByIdAsync(Guid userId, Guid aiCardId, Guid modelId, CancellationToken ct = default)
    {
        return await _db.AiCardModels
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.Id == modelId && m.UserId == userId && m.AiCardId == aiCardId,
                ct)
            .ConfigureAwait(false);
    }

    public async Task<int> CountByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardModels
            .AsNoTracking()
            .CountAsync(m => m.UserId == userId && m.AiCardId == aiCardId, ct)
            .ConfigureAwait(false);
    }

    public async Task DeleteAsync(AiCardModel model, CancellationToken ct = default)
    {
        await _db.AiCardModels
            .Where(m => m.Id == model.Id)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AiCardModel>> ListOthersByCardAsync(Guid userId, Guid aiCardId, Guid excludeId, CancellationToken ct = default)
    {
        return await _db.AiCardModels
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.AiCardId == aiCardId && m.Id != excludeId)
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task DeactivateAllByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        await _db.AiCardModels
            .Where(m => m.UserId == userId && m.AiCardId == aiCardId && m.IsActive)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsActive, false), ct)
            .ConfigureAwait(false);
    }

    public async Task ActivateByIdAsync(Guid userId, Guid aiCardId, Guid modelId, CancellationToken ct = default)
    {
        await _db.AiCardModels
            .Where(m => m.UserId == userId && m.AiCardId == aiCardId && m.Id == modelId)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsActive, true), ct)
            .ConfigureAwait(false);
    }

    public async Task<AiCardModel?> GetActiveByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardModels
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.UserId == userId && m.AiCardId == aiCardId && m.IsActive, ct)
            .ConfigureAwait(false);
    }

    public async Task SetThumbnailUrlAsync(Guid userId, Guid aiCardId, Guid modelId, string thumbnailUrl, CancellationToken ct = default)
    {
        await _db.AiCardModels
            .Where(m => m.Id == modelId && m.UserId == userId && m.AiCardId == aiCardId)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.ThumbnailUrl, thumbnailUrl), ct)
            .ConfigureAwait(false);
    }

}
