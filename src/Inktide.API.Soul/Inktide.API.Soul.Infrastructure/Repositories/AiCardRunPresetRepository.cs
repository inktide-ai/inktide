using System.Data;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

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

    public Task UpdateAsync(AiCardRunPreset preset, CancellationToken ct = default)
    {
        _db.AiCardRunPresets.Update(preset);
        return Task.CompletedTask;
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

        await using var tx = await _db.Database
            .BeginTransactionAsync(IsolationLevel.ReadCommitted, ct)
            .ConfigureAwait(false);

        foreach (var (id, sortKey) in updates)
        {
            await _db.AiCardRunPresets
                .Where(p => p.Id == id && p.UserId == userId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(e => e.SortKey, sortKey)
                    .SetProperty(e => e.UpdatedAt, updatedAt), ct)
                .ConfigureAwait(false);
        }

        await tx.CommitAsync(ct).ConfigureAwait(false);
    }

}
