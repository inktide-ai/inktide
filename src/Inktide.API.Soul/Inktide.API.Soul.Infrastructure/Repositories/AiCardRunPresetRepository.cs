using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class AiCardRunPresetRepository : IAiCardRunPresetRepository
{

    private readonly SoulDbContext _db;


    public AiCardRunPresetRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public async Task<IReadOnlyList<AiCardRunPreset>> GetAllAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardRunPresets
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.AiCardId == aiCardId)
            .OrderBy(p => p.SortKey)
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<AiCardRunPreset?> GetByIdAsync(Guid userId, Guid aiCardId, Guid presetId, CancellationToken ct = default)
    {
        return await _db.AiCardRunPresets
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.Id == presetId && p.UserId == userId && p.AiCardId == aiCardId,
                ct)
            .ConfigureAwait(false);
    }

    public async Task<AiCardRunPreset?> GetActiveAsync(Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardRunPresets
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.AiCardId == aiCardId && p.IsActive, ct)
            .ConfigureAwait(false);
    }

    public Task<AiCardRunPreset> AddAsync(AiCardRunPreset preset, CancellationToken ct = default)
    {
        _db.AiCardRunPresets.Add(preset);
        return Task.FromResult(preset);
    }

    public async Task UpdateAsync(AiCardRunPreset preset, CancellationToken ct = default)
    {
        var tracked = await _db.AiCardRunPresets.FirstOrDefaultAsync(c => c.Id == preset.Id, ct);
        if (tracked is null) return;
        _db.Entry(tracked).CurrentValues.SetValues(preset);
    }

    public async Task DeleteAsync(AiCardRunPreset preset, CancellationToken ct = default)
    {
        await _db.AiCardRunPresets
            .Where(p => p.Id == preset.Id)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task DeactivateAllAsync(Guid aiCardId, Guid? exceptId, DateTime updatedAt, CancellationToken ct = default)
    {
        await _db.AiCardRunPresets
            .Where(p => p.AiCardId == aiCardId && p.IsActive && (exceptId == null || p.Id != exceptId))
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(e => e.IsActive, false)
                    .SetProperty(e => e.UpdatedAt, updatedAt),
                ct)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid aiCardId, CancellationToken ct = default)
    {
        var rows = await _db.AiCardRunPresets
            .AsNoTracking()
            .Where(p => p.AiCardId == aiCardId)
            .OrderBy(p => p.SortKey)
            .Select(p => new { p.Id, p.SortKey })
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
            @"UPDATE soul.ai_card_run_presets
              SET sort_key = v.sort_key, updated_at = @updated_at
              FROM UNNEST(@ids, @keys) AS v(id uuid, sort_key text)
              WHERE soul.ai_card_run_presets.id = v.id
                AND soul.ai_card_run_presets.user_id = @user_id",
            new NpgsqlParameter("ids",        NpgsqlDbType.Array | NpgsqlDbType.Uuid) { Value = ids },
            new NpgsqlParameter("keys",       NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = keys },
            new NpgsqlParameter("updated_at", NpgsqlDbType.Timestamp)                 { Value = updatedAt },
            new NpgsqlParameter("user_id",    NpgsqlDbType.Uuid)                      { Value = userId })
            .ConfigureAwait(false);
    }

}
