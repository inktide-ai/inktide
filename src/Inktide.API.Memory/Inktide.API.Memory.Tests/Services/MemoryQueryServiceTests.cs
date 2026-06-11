using Inktide.API.Memory.Application.Services;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace Inktide.API.Memory.Tests.Services;

public sealed class MemoryQueryServiceTests
{
    private static readonly Guid CardId = Guid.NewGuid();

    private static (MemoryQueryService Service,
                    IEmbeddingGenerator<string, Embedding<float>> Embedder,
                    IVectorMemoryRepository VectorRepo,
                    IMemoryMetadataRepository MetaRepo)
        Create()
    {
        var embedder     = Substitute.For<IEmbeddingGenerator<string, Embedding<float>>>();
        var vector       = Substitute.For<IVectorMemoryRepository>();
        var meta         = Substitute.For<IMemoryMetadataRepository>();
        var sp           = Substitute.For<IServiceProvider>();
        var scope        = Substitute.For<IServiceScope>();
        var scopeFactory = Substitute.For<IServiceScopeFactory>();

        sp.GetService(typeof(IMemoryMetadataRepository)).Returns(meta);
        scope.ServiceProvider.Returns(sp);
        scopeFactory.CreateScope().Returns(scope);

        var service = new MemoryQueryService(embedder, vector, scopeFactory,
            NullLogger<MemoryQueryService>.Instance);
        return (service, embedder, vector, meta);
    }

    private static GeneratedEmbeddings<Embedding<float>> MakeSingleEmbedding() =>
        new(new[] { new Embedding<float>(new float[] { 0.1f, 0.2f }) });

    private static MemoryRecord MakeRecord(Guid pointId) =>
        new(pointId, "fact text", "general", 0.8, 0.95f, DateTime.UtcNow);


    [Fact]
    public async Task QueryAsync_ReturnsMatchedRecords_AndUpdatesRecall()
    {
        var (svc, embedder, vector, meta) = Create();
        var pointId = Guid.NewGuid();
        var records = new[] { MakeRecord(pointId) };

        embedder.GenerateAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<EmbeddingGenerationOptions?>(),
            Arg.Any<CancellationToken>())
            .Returns(MakeSingleEmbedding());
        vector.SearchAsync(Arg.Any<ReadOnlyMemory<float>>(), CardId, 5, Arg.Any<CancellationToken>())
            .Returns(records);

        var result = await svc.QueryAsync(CardId, "what does the user like?");

        // Recall update is fire-and-forget; wait briefly for the background task to complete.
        await Task.Delay(200);

        Assert.Single(result);
        Assert.Equal(pointId, result[0].PointId);
        await meta.Received(1).UpdateRecallAsync(
            CardId,
            Arg.Is<IReadOnlyList<Guid>>(ids => ids.Contains(pointId)),
            Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task QueryAsync_NoResults_ReturnsEmptyList_NoRecallUpdate()
    {
        var (svc, embedder, vector, meta) = Create();
        embedder.GenerateAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<EmbeddingGenerationOptions?>(),
            Arg.Any<CancellationToken>())
            .Returns(MakeSingleEmbedding());
        vector.SearchAsync(Arg.Any<ReadOnlyMemory<float>>(), CardId, 5, Arg.Any<CancellationToken>())
            .Returns(Array.Empty<MemoryRecord>());

        var result = await svc.QueryAsync(CardId, "unknown topic");

        Assert.Empty(result);
        await meta.DidNotReceiveWithAnyArgs().UpdateRecallAsync(default, default!, default);
    }


    [Fact]
    public async Task QueryAsync_ForwardsTopKToVectorRepo()
    {
        var (svc, embedder, vector, _) = Create();
        embedder.GenerateAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<EmbeddingGenerationOptions?>(),
            Arg.Any<CancellationToken>())
            .Returns(MakeSingleEmbedding());
        vector.SearchAsync(Arg.Any<ReadOnlyMemory<float>>(), Arg.Any<Guid>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<MemoryRecord>());

        await svc.QueryAsync(CardId, "query", topK: 10);

        await vector.Received(1).SearchAsync(
            Arg.Any<ReadOnlyMemory<float>>(), CardId, 10, Arg.Any<CancellationToken>());
    }
}
