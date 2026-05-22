using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Microsoft.Extensions.Options;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace Inktide.API.Memory.Infrastructure.Qdrant;

/// <summary>
/// Direct Qdrant.Client implementation of <see cref="IVectorMemoryRepository"/>.
/// Uses PointStruct + payload dictionary — no SK VectorData abstractions.
/// Collection: chat_memories, vector size: 768 (nomic-embed-text), distance: Cosine.
/// </summary>
public sealed class QdrantMemoryRepository : IVectorMemoryRepository
{
    private readonly QdrantClient _qdrant;
    private readonly QdrantSettings _settings;
    
    public QdrantMemoryRepository(
        QdrantClient qdrant,
        IOptions<QdrantSettings> settings)
    {
        _qdrant = qdrant ?? throw new ArgumentNullException(nameof(qdrant));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
    }
    
    public async Task UpsertAsync(
        Guid pointId,
        Guid aiCardId,
        string factText,
        string category,
        double importance,
        DateTime rememberedAt,
        ReadOnlyMemory<float> embedding,
        CancellationToken ct = default)
    {
        var point = new PointStruct
        {
            Id      = new PointId { Uuid = pointId.ToString() },
            Vectors = embedding.ToArray(),
        };

        point.Payload["ai_card_id"]    = aiCardId.ToString();
        point.Payload["fact_text"]     = factText;
        point.Payload["category"]      = category;
        point.Payload["importance"]    = importance;
        point.Payload["remembered_at"] = rememberedAt.ToString("O");

        await _qdrant.UpsertAsync(_settings.CollectionName, [point], cancellationToken: ct);
    }

    public async Task<IReadOnlyList<MemoryRecord>> SearchAsync(
        ReadOnlyMemory<float> vector,
        Guid aiCardId,
        int topK,
        CancellationToken ct = default)
    {
        var filter = new Filter();
        filter.Must.Add(new Condition
        {
            Field = new FieldCondition
            {
                Key   = "ai_card_id",
                Match = new Match { Keyword = aiCardId.ToString() },
            },
        });

        var hits = await _qdrant.SearchAsync(
            _settings.CollectionName,
            vector,
            filter:          filter,
            limit:           (ulong)topK,
            cancellationToken: ct);

        return hits
            .Select(h => new MemoryRecord(
                PointId:      Guid.Parse(h.Id.Uuid),
                FactText:     h.Payload.TryGetValue("fact_text",     out var ft)  ? ft.StringValue  : string.Empty,
                Category:     h.Payload.TryGetValue("category",      out var cat) ? cat.StringValue : string.Empty,
                Importance:   h.Payload.TryGetValue("importance",    out var imp) ? imp.DoubleValue : 0d,
                Score:        h.Score,
                RememberedAt: h.Payload.TryGetValue("remembered_at", out var rat)
                              && DateTime.TryParse(rat.StringValue, out var dt)
                              ? dt : DateTime.UnixEpoch))
            .ToList();
    }
}
