using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using Chimera.AI.Orchestrator.Application.Contracts;
using Chimera.AI.Orchestrator.Application.Models;
using Chimera.AI.Orchestrator.Infrastructure.Settings;

namespace Chimera.AI.Orchestrator.Infrastructure.Qdrant;

/// <summary>
/// Vector memory backed by Qdrant. Handles collection creation, upsert, and filtered search.
/// </summary>
public sealed class QdrantMemoryService : IMemoryService
{
    private readonly QdrantClient _client;
    private readonly QdrantSettings _settings;
    private readonly ILogger<QdrantMemoryService> _logger;
    private readonly SemaphoreSlim _initLock = new(1, 1);
    private bool _collectionReady;

    public QdrantMemoryService(
        IOptions<QdrantSettings> settings,
        ILogger<QdrantMemoryService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        _client = new QdrantClient(_settings.Host, _settings.GrpcPort);
    }

    public async Task<IReadOnlyList<MemoryFragment>> SearchAsync(
        float[] queryVector,
        string? viewerId = null,
        string? platform = null,
        string? channelId = null,
        MemoryType? type = null,
        int limit = 5,
        float scoreThreshold = 0.5f,
        CancellationToken ct = default)
    {
        await EnsureCollectionAsync(ct);

        var filters = new List<Condition>();

        if (viewerId is not null)
            filters.Add(FieldCondition("viewerId", viewerId));
        if (platform is not null)
            filters.Add(FieldCondition("platform", platform));
        if (channelId is not null)
            filters.Add(FieldCondition("channelId", channelId));
        if (type is not null)
            filters.Add(FieldCondition("type", type.Value.ToString()));

        Filter? filter = filters.Count > 0
            ? new Filter { Must = { filters }  }
            : null;

        var results = await _client.SearchAsync(
            collectionName: _settings.CollectionName,
            vector: queryVector,
            filter: filter,
            limit: (ulong)limit,
            scoreThreshold: scoreThreshold,
            payloadSelector: true,
            cancellationToken: ct);

        var fragments = new List<MemoryFragment>(results.Count);

        foreach (var point in results)
        {
            var payload = point.Payload;

            var fragment = new MemoryFragment(
                Id: Guid.Parse(point.Id.Uuid),
                Text: payload.GetValueOrDefault("text")?.StringValue ?? "",
                Score: point.Score,
                Type: Enum.TryParse<MemoryType>(
                    payload.GetValueOrDefault("type")?.StringValue, out var mt) ? mt : MemoryType.Message,
                ViewerId: payload.GetValueOrDefault("viewerId")?.StringValue ?? "",
                Platform: payload.GetValueOrDefault("platform")?.StringValue ?? "",
                ChannelId: payload.GetValueOrDefault("channelId")?.StringValue,
                Timestamp: DateTimeOffset.FromUnixTimeSeconds(
                    (long)(payload.GetValueOrDefault("timestamp")?.IntegerValue ?? 0)));

            fragments.Add(fragment);
        }

        _logger.LogDebug(
            "Qdrant search returned {Count} results (threshold={Threshold})",
            fragments.Count, scoreThreshold);

        return fragments;
    }

    public async Task StoreAsync(MemoryEntry entry, CancellationToken ct = default)
    {
        await EnsureCollectionAsync(ct);

        var pointId = Guid.NewGuid();

        var payload = new Dictionary<string, Value>
        {
            ["text"] = entry.Text,
            ["type"] = entry.Type.ToString(),
            ["viewerId"] = entry.ViewerId,
            ["viewerName"] = entry.ViewerName,
            ["platform"] = entry.Platform,
            ["channelId"] = entry.ChannelId,
            ["channelName"] = entry.ChannelName,
            ["timestamp"] = (long)entry.Timestamp.ToUnixTimeSeconds()
        };

        var point = new PointStruct
        {
            Id = new PointId { Uuid = pointId.ToString() },
            Vectors = entry.Vector,
            Payload = { payload }
        };

        await _client.UpsertAsync(
            collectionName: _settings.CollectionName,
            points: [point],
            cancellationToken: ct);

        _logger.LogDebug(
            "Stored memory {Id} for viewer {Viewer} on {Platform}",
            pointId, entry.ViewerId, entry.Platform);
    }

    public async Task DeleteByViewerAsync(string viewerId, string platform, CancellationToken ct = default)
    {
        await EnsureCollectionAsync(ct);

        var filter = new Filter
        {
            Must =
            {
                FieldCondition("viewerId", viewerId),
                FieldCondition("platform", platform)
            }
        };

        await _client.DeleteAsync(
            collectionName: _settings.CollectionName,
            filter: filter,
            cancellationToken: ct);

        _logger.LogInformation(
            "Deleted all memories for viewer {ViewerId} on {Platform}",
            viewerId, platform);
    }

    private async Task EnsureCollectionAsync(CancellationToken ct)
    {
        if (_collectionReady) return;

        await _initLock.WaitAsync(ct);
        try
        {
            if (_collectionReady) return;

            var collections = await _client.ListCollectionsAsync(ct);
            if (collections.Any(c => c == _settings.CollectionName))
            {
                _collectionReady = true;
                _logger.LogInformation("Qdrant collection '{Collection}' already exists", _settings.CollectionName);
                return;
            }

            await _client.CreateCollectionAsync(
                collectionName: _settings.CollectionName,
                vectorsConfig: new VectorParams
                {
                    Size = _settings.VectorSize,
                    Distance = Distance.Cosine
                },
                cancellationToken: ct);

            _logger.LogInformation(
                "Created Qdrant collection '{Collection}' (dim={Dim}, distance=Cosine)",
                _settings.CollectionName, _settings.VectorSize);

            _collectionReady = true;
        }
        finally
        {
            _initLock.Release();
        }
    }

    private static Condition FieldCondition(string key, string value) =>
        new()
        {
            Field = new FieldCondition
            {
                Key = key,
                Match = new Match { Keyword = value }
            }
        };
}
