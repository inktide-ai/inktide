using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class AiCardSceneRepository : IAiCardSceneRepository
{

    private readonly SoulDbContext _db;


    public AiCardSceneRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public Task<AiCardScene> AddAsync(AiCardScene scene, CancellationToken ct = default)
    {
        _db.AiCardScenes.Add(scene);
        return Task.FromResult(scene);
    }

    public async Task<IReadOnlyList<AiCardScene>> ListByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardScenes
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.AiCardId == aiCardId)
            .OrderBy(s => s.SortKey)
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<AiCardScene?> GetByIdAsync(Guid userId, Guid aiCardId, Guid sceneId, CancellationToken ct = default)
    {
        return await _db.AiCardScenes
            .AsNoTracking()
            .FirstOrDefaultAsync(
                s => s.Id == sceneId && s.UserId == userId && s.AiCardId == aiCardId,
                ct)
            .ConfigureAwait(false);
    }

    public async Task DeleteAsync(AiCardScene scene, CancellationToken ct = default)
    {
        await _db.AiCardScenes
            .Where(s => s.Id == scene.Id)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AiCardScene>> ListOthersByCardAsync(Guid userId, Guid aiCardId, Guid excludeId, CancellationToken ct = default)
    {
        return await _db.AiCardScenes
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.AiCardId == aiCardId && s.Id != excludeId)
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }


    public async Task<IReadOnlyList<string>> ListDistinctTagsByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardScenes
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.AiCardId == aiCardId && s.Tag != null && s.Tag != "")
            .Select(s => s.Tag!)
            .Distinct()
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }


    public async Task<bool> UpdateTagAsync(Guid userId, Guid aiCardId, Guid sceneId, string? tag, CancellationToken ct = default)
    {
        var affected = await _db.AiCardScenes
            .Where(s => s.Id == sceneId && s.UserId == userId && s.AiCardId == aiCardId)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.Tag, tag), ct)
            .ConfigureAwait(false);

        return affected > 0;
    }

    public async Task<bool> UpdateMetadataAsync(
        Guid userId,
        Guid aiCardId,
        Guid sceneId,
        string? displayName,
        string? description,
        string? tag,
        CancellationToken ct = default)
    {
        var affected = await _db.AiCardScenes
            .Where(s => s.Id == sceneId && s.UserId == userId && s.AiCardId == aiCardId)
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(e => e.DisplayName, displayName)
                    .SetProperty(e => e.Description, description)
                    .SetProperty(e => e.Tag, tag),
                ct)
            .ConfigureAwait(false);

        return affected > 0;
    }

    public async Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid aiCardId, CancellationToken ct = default)
    {
        var rows = await _db.AiCardScenes
            .AsNoTracking()
            .Where(s => s.AiCardId == aiCardId)
            .OrderBy(s => s.SortKey)
            .Select(s => new { s.Id, s.SortKey })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return rows.Select(r => (r.Id, r.SortKey)).ToList();
    }

    public async Task BulkUpdateSortKeysAsync(IReadOnlyList<(Guid Id, string SortKey)> updates, CancellationToken ct = default)
    {
        // ExecuteUpdateAsync bypasses the EF change tracker — an explicit transaction is required.
        // SaveChangesAsync's implicit transaction does NOT cover these calls.
        // N round-trips inside one transaction. Acceptable for typical sort-list sizes.
        await using var tx = await _db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);
        foreach (var (id, sortKey) in updates)
        {
            await _db.AiCardScenes
                .Where(s => s.Id == id)
                .ExecuteUpdateAsync(
                    s => s.SetProperty(e => e.SortKey, sortKey),
                    ct)
                .ConfigureAwait(false);
        }
        await tx.CommitAsync(ct).ConfigureAwait(false);
    }

}

