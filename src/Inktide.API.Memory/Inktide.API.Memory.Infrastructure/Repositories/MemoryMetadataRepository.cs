using Inktide.API.Core.Generators;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Memory.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Memory.Infrastructure.Repositories;

public sealed class MemoryMetadataRepository : IMemoryMetadataRepository
{
    private readonly MemoryDbContext _db;

    public MemoryMetadataRepository(MemoryDbContext db) => _db = db;

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
            .AnyAsync(m => m.CharacterId == aiCardId && m.QdrantPointId == qdrantPointId, ct);

        if (!exists)
        {
            _db.MemoryMetadata.Add(new MemoryMetadata
            {
                Id            = IdGenerator.New(),
                CharacterId      = aiCardId,
                QdrantPointId = qdrantPointId,
                FactText      = factText,
                Category      = category,
                SourceType    = sourceType,
                Importance    = importance,
                RememberedAt  = rememberedAt,
                ExpiresAt     = expiresAt,
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
