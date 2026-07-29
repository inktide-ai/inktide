using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Microsoft.Extensions.Options;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace Inktide.API.Memory.Infrastructure.Qdrant;

/// <summary>
/// Direct Qdrant.Client implementation of <see cref="IVectorMemoryRepository"/>.
/// Uses PointStruct + payload dictionary - no SK VectorData abstractions.
/// Collection: chat_memories, vector size: configured via QdrantSettings.VectorSize, distance: Cosine.
/// </summary>
public sealed class QdrantMemoryRepository : IVectorMemoryRepository
{
    private readonly QdrantClient _qdrant;
    private readonly QdrantSettings _settings;

    private static class PayloadKeys
    {
        public const string AiCardId     = "ai_card_id";
        public const string FactText     = "fact_text";
        public const string Category     = "category";
        public const string Importance   = "importance";
        public const string RememberedAt = "remembered_at";
    }

    public QdrantMemoryRepository(
        QdrantClient qdrant,
        IOptions<QdrantSettings> settings)
    {
        _qdrant   = qdrant ?? throw new ArgumentNullException(nameof(qdrant));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
    }

    private PointStruct BuildPoint(VectorUpsertRequest r)
    {
        var point = new PointStruct
        {
            Id      = new PointId { Uuid = r.PointId.ToString() },
            Vectors = r.Embedding.ToArray(),
        };
        point.Payload[PayloadKeys.AiCardId]    = r.AiCardId.ToString();
        point.Payload[PayloadKeys.FactText]    = r.FactText;
        point.Payload[PayloadKeys.Category]    = r.Category;
        point.Payload[PayloadKeys.Importance]  = r.Importance;
        point.Payload[PayloadKeys.RememberedAt] = r.RememberedAt.ToString("O");
        return point;
    }

    public Task UpsertAsync(VectorUpsertRequest request, CancellationToken ct = default) =>
        UpsertBatchAsync([request], ct);

    public async Task UpsertBatchAsync(IReadOnlyList<VectorUpsertRequest> requests, CancellationToken ct = default)
    {
        var points = requests.Select(BuildPoint).ToList();
        await _qdrant.UpsertAsync(_settings.CollectionName, points, cancellationToken: ct);
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
                Key   = PayloadKeys.AiCardId,
                Match = new Match { Keyword = aiCardId.ToString() },
            },
        });

        var hits = await _qdrant.SearchAsync(
            _settings.CollectionName,
            vector,
            filter:            filter,
            limit:             (ulong)topK,
            cancellationToken: ct);

        return hits
            .Select(h => new MemoryRecord(
                PointId:      Guid.Parse(h.Id.Uuid),
                FactText:     h.Payload.TryGetValue(PayloadKeys.FactText,     out var ft)  ? ft.StringValue  : string.Empty,
                Category:     h.Payload.TryGetValue(PayloadKeys.Category,     out var cat) ? cat.StringValue : string.Empty,
                Importance:   h.Payload.TryGetValue(PayloadKeys.Importance,   out var imp) ? imp.DoubleValue : 0d,
                Score:        h.Score,
                RememberedAt: h.Payload.TryGetValue(PayloadKeys.RememberedAt, out var rat)
                              && DateTime.TryParse(rat.StringValue, out var dt)
                              ? dt
                              : throw new InvalidOperationException(
                                    $"Qdrant point {h.Id.Uuid} missing valid 'remembered_at' payload")))
            .ToList();
    }
}
