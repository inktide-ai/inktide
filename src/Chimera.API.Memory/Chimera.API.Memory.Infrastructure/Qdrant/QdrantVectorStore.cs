using Chimera.API.Memory.Domain.Models;
using Chimera.API.Memory.Domain.Ports;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace Chimera.API.Memory.Infrastructure.Qdrant;

public sealed class QdrantVectorStore : IVectorStore
{
    private readonly QdrantClient _client;
    private readonly IOptions<QdrantSettings> _settings;
    private readonly ILogger<QdrantVectorStore> _logger;

    public QdrantVectorStore(
        QdrantClient client,
        IOptions<QdrantSettings> settings,
        ILogger<QdrantVectorStore> logger)
    {
        _client = client;
        _settings = settings;
        _logger = logger;
    }

    public async Task<IReadOnlyList<MemoryRecord>> SearchAsync(
        float[] queryVector,
        Guid aiCardId,
        int topK,
        CancellationToken ct = default)
    {
        var filter = new Filter
        {
            Must =
            {
                new Condition
                {
                    Field = new FieldCondition
                    {
                        Key = "ai_card_id",
                        Match = new Match { Keyword = aiCardId.ToString() }
                    }
                }
            }
        };

        var results = await _client.SearchAsync(
            collectionName: _settings.Value.CollectionName,
            vector: queryVector,
            filter: filter,
            limit: (ulong)topK,
            payloadSelector: new WithPayloadSelector { Enable = true },
            cancellationToken: ct);

        return results
            .Select(r => new MemoryRecord(
                PointId: Guid.Parse(r.Id.Uuid),
                FactText: r.Payload.GetValueOrDefault("fact_text")?.StringValue ?? string.Empty,
                Category: r.Payload.GetValueOrDefault("category")?.StringValue ?? "general",
                Importance: r.Payload.GetValueOrDefault("importance")?.DoubleValue ?? 0.5,
                Score: r.Score,
                RememberedAt: r.Payload.TryGetValue("remembered_at", out var ts)
                    ? DateTime.Parse(ts.StringValue)
                    : DateTime.UtcNow))
            .ToList();
    }

    public async Task UpsertAsync(
        Guid pointId,
        float[] vector,
        string factText,
        Guid aiCardId,
        string category,
        double importance,
        DateTime rememberedAt,
        CancellationToken ct = default)
    {
        var point = new PointStruct
        {
            Id = new PointId { Uuid = pointId.ToString() },
            Vectors = vector,
            Payload =
            {
                ["ai_card_id"] = aiCardId.ToString(),
                ["fact_text"] = factText,
                ["category"] = category,
                ["importance"] = importance,
                ["remembered_at"] = rememberedAt.ToString("O")
            }
        };

        await _client.UpsertAsync(
            collectionName: _settings.Value.CollectionName,
            points: [point],
            cancellationToken: ct);
    }

    public async Task DeleteByAiCardAsync(Guid aiCardId, CancellationToken ct = default)
    {
        var filter = new Filter
        {
            Must =
            {
                new Condition
                {
                    Field = new FieldCondition
                    {
                        Key = "ai_card_id",
                        Match = new Match { Keyword = aiCardId.ToString() }
                    }
                }
            }
        };

        await _client.DeleteAsync(
            collectionName: _settings.Value.CollectionName,
            filter: filter,
            cancellationToken: ct);
    }
}
