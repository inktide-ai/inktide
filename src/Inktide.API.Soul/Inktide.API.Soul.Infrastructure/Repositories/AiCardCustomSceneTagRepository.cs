using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class AiCardCustomSceneTagRepository : IAiCardCustomSceneTagRepository
{

    private readonly SoulDbContext _db;


    public AiCardCustomSceneTagRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public async Task<IReadOnlyList<(string Label, string? Color)>> ListByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardCustomSceneTags
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.AiCardId == aiCardId)
            .OrderBy(t => t.Label)
            .Select(t => new ValueTuple<string, string?>(t.Label, t.Color))
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }


    public async Task<bool> ExistsNormalizedAsync(Guid userId, Guid aiCardId, string labelNormalized, CancellationToken ct = default)
    {
        return await _db.AiCardCustomSceneTags
            .AsNoTracking()
            .AnyAsync(
                t => t.UserId == userId && t.AiCardId == aiCardId && t.LabelNormalized == labelNormalized,
                ct)
            .ConfigureAwait(false);
    }


    public async Task AddAsync(AiCardCustomSceneTag row, CancellationToken ct = default)
    {
        _db.AiCardCustomSceneTags.Add(row);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

}
