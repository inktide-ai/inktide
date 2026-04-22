using Chimera.API.Memory.Infrastructure.Qdrant;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace Chimera.API.Memory.Infrastructure.Workers;

/// <summary>
/// Ensures the Qdrant collection exists before ingestion or query workers start.
/// Creates it with Cosine distance and 768-dim vectors (nomic-embed-text) if absent.
/// </summary>
internal sealed class VectorCollectionInitializer(
    QdrantClient qdrant,
    IOptions<QdrantSettings> settings,
    ILogger<VectorCollectionInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var collectionName = settings.Value.CollectionName;
        var exists = await qdrant.CollectionExistsAsync(collectionName, cancellationToken);

        if (!exists)
        {
            await qdrant.CreateCollectionAsync(
                collectionName,
                new VectorParams { Size = 768, Distance = Distance.Cosine },
                cancellationToken: cancellationToken);

            logger.LogInformation(
                "VectorCollectionInitializer: created collection '{Collection}'.", collectionName);
        }
        else
        {
            logger.LogInformation(
                "VectorCollectionInitializer: collection '{Collection}' already exists.", collectionName);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
