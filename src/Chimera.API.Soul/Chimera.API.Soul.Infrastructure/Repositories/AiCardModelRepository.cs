using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Soul.Infrastructure.Repositories;

public sealed class AiCardModelRepository : IAiCardModelRepository
{

    private readonly SoulDbContext _db;


    public AiCardModelRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public async Task<AiCardModel> AddAsync(AiCardModel model, CancellationToken ct = default)
    {
        _db.AiCardModels.Add(model);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return model;
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

}
