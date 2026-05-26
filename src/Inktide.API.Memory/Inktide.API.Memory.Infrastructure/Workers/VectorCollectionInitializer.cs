using Grpc.Core;
using Inktide.API.Memory.Infrastructure.Qdrant;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace Inktide.API.Memory.Infrastructure.Workers;

/// <summary>
/// Ensures the Qdrant collection exists before ingestion or query workers start.
/// Creates it with Cosine distance and <c>QdrantSettings.VectorSize</c>-dim vectors if absent.
/// </summary>
internal sealed class VectorCollectionInitializer(
    QdrantClient qdrant,
    IOptions<QdrantSettings> settings,
    ILogger<VectorCollectionInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var collectionName = settings.Value.CollectionName;
        try
        {
            await qdrant.CreateCollectionAsync(
                collectionName,
                new VectorParams { Size = (ulong)settings.Value.VectorSize, Distance = Distance.Cosine },
                cancellationToken: cancellationToken);

            logger.LogInformation(
                "VectorCollectionInitializer: created collection '{Collection}'.", collectionName);
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.AlreadyExists)
        {
            logger.LogInformation(
                "VectorCollectionInitializer: collection '{Collection}' already exists.", collectionName);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
