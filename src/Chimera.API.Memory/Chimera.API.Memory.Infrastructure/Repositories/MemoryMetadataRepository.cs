using Chimera.API.Memory.Domain.Ports;
using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Memory.Infrastructure.Repositories;

/// <summary>
/// PostgreSQL mirror of Qdrant vectors via Soul's <see cref="SoulDbContext"/>.
/// Registered as Scoped in DryIoc so it shares the EF context lifetime.
/// </summary>
public sealed class MemoryMetadataRepository : IMemoryMetadataRepository
{
    private readonly SoulDbContext _db;

    public MemoryMetadataRepository(SoulDbContext db)
    {
        _db = db;
    }

    public async Task UpsertAsync(
        Guid aiCardId,
        string qdrantPointId,
        string factText,
        string category,
        string sourceType,
        double importance,
        DateTime rememberedAt,
        DateTime? expiresAt,
        CancellationToken ct = default)
    {
        var exists = await _db.MemoryMetadata
            .AnyAsync(m => m.AiCardId == aiCardId && m.QdrantPointId == qdrantPointId, ct);

        if (!exists)
        {
            _db.MemoryMetadata.Add(new MemoryMetadata
            {
                Id = Guid.NewGuid(),
                AiCardId = aiCardId,
                QdrantPointId = qdrantPointId,
                FactText = factText,
                Category = category,
                SourceType = sourceType,
                Importance = importance,
                RememberedAt = rememberedAt,
                ExpiresAt = expiresAt
            });

            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task UpdateRecallAsync(
        Guid aiCardId,
        IReadOnlyList<Guid> qdrantPointIds,
        CancellationToken ct = default)
    {
        var pointStrings = qdrantPointIds.Select(p => p.ToString()).ToList();

        await _db.MemoryMetadata
            .Where(m => m.AiCardId == aiCardId && pointStrings.Contains(m.QdrantPointId))
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
}
