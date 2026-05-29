using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class AiCardSceneRepository : IAiCardSceneRepository
{

    private readonly SoulDbContext _db;


    public AiCardSceneRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public async Task<AiCardScene> AddAsync(AiCardScene scene, CancellationToken ct = default)
    {
        // TODO: SaveChangesAsync called here directly because SoulDbContext DI scope
        // mismatch between repositories and SoulTransactionManager (DryIoc vs MS DI).
        // Real fix: ensure single SoulDbContext instance per request in DryIoc registration.
        _db.AiCardScenes.Add(scene);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return scene;
    }

    public async Task<int> CountByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardScenes
            .AsNoTracking()
            .CountAsync(s => s.UserId == userId && s.AiCardId == aiCardId, ct)
            .ConfigureAwait(false);
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

    public async Task BulkUpdateSortKeysAsync(Guid userId, IReadOnlyList<(Guid Id, string SortKey)> updates, DateTime updatedAt, CancellationToken ct = default)
    {
        if (updates.Count == 0) return;

        var ids  = updates.Select(u => u.Id).ToArray();
        var keys = updates.Select(u => u.SortKey).ToArray();

        await _db.Database.ExecuteSqlRawAsync(
            @"UPDATE soul.ai_card_scenes
              SET sort_key = v.sort_key
              FROM UNNEST(@ids, @keys) AS v(id uuid, sort_key text)
              WHERE soul.ai_card_scenes.id = v.id
                AND soul.ai_card_scenes.user_id = @user_id",
            new NpgsqlParameter("ids",     NpgsqlDbType.Array | NpgsqlDbType.Uuid) { Value = ids },
            new NpgsqlParameter("keys",    NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = keys },
            new NpgsqlParameter("user_id", NpgsqlDbType.Uuid)                      { Value = userId })
            .ConfigureAwait(false);
    }

}

