using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Memory.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Memory.Infrastructure.Repositories;

public sealed class MemoryMetadataRepository : IMemoryMetadataRepository, IMemoryMaintenanceRepository
{
    private readonly MemoryDbContext _db;

    public MemoryMetadataRepository(MemoryDbContext db) => _db = db;

    public Task UpsertAsync(MemoryMetadata m, CancellationToken ct = default) =>
        _db.Database.ExecuteSqlAsync(
            $"""
             INSERT INTO soul.memory_metadata
                 (id, ai_card_id, qdrant_point_id, fact_text, category, source_type,
                  importance, remembered_at, expires_at)
             VALUES
                 ({m.Id}, {m.CharacterId}, {m.QdrantPointId}, {m.FactText},
                  {m.Category}, {m.SourceType}, {m.Importance}, {m.RememberedAt}, {m.ExpiresAt})
             ON CONFLICT (ai_card_id, qdrant_point_id) DO NOTHING
             """,
            ct);

    public async Task UpsertBatchAsync(IReadOnlyList<MemoryMetadata> records, CancellationToken ct = default)
    {
        if (records.Count == 0) return;
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        foreach (var r in records)
            await UpsertAsync(r, ct);
        await tx.CommitAsync(ct);
    }

    public async Task UpdateRecallAsync(
        Guid aiCardId,
        IReadOnlyList<Guid> qdrantPointIds,
        CancellationToken ct = default)
    {
        var pointStrings = qdrantPointIds.Select(p => p.ToString()).ToList();

        await _db.MemoryMetadata
            .Where(m => m.CharacterId == aiCardId && pointStrings.Contains(m.QdrantPointId))
            .ExecuteUpdateAsync(s => s
                .SetProperty(m => m.LastRecalledAt, DateTime.UtcNow)
                .SetProperty(m => m.RecallCount, m => m.RecallCount + 1),
                ct);
    }

    public async Task DeleteExpiredAsync(CancellationToken ct = default)
    {
        await _db.MemoryMetadata
            .Where(m => m.ExpiresAt != null && m.ExpiresAt < DateTime.UtcNow)
            .ExecuteDeleteAsync(ct);
    }

    public Task<int> CountTotalAsync(CancellationToken ct = default) =>
        _db.MemoryMetadata.CountAsync(ct);
}
