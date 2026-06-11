using Inktide.API.Memory.Application.Configuration;
using Inktide.API.Memory.Application.Services;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;

namespace Inktide.API.Memory.Tests.Services;

public sealed class MemoryIngestionPipelineTests
{
    private static readonly Guid CardId = Guid.NewGuid();

    private static MemoryIngestionJob MakeJob() => new(
        CharacterId: CardId,
        ChannelId:   "ch-1",
        Platform:    "twitch",
        UserMessage: "hello",
        BotResponse: "hi there",
        SenderName:  "user1",
        Timestamp:   DateTimeOffset.UtcNow);

    private static (MemoryIngestionPipeline Pipeline,
                    IFactExtractionClient Scribe,
                    IEmbeddingGenerator<string, Embedding<float>> Embedder,
                    IVectorMemoryRepository VectorRepo,
                    IMemoryMetadataRepository MetaRepo)
        Create(double threshold = 0.3, int retentionDays = 90)
    {
        var scribe   = Substitute.For<IFactExtractionClient>();
        var embedder = Substitute.For<IEmbeddingGenerator<string, Embedding<float>>>();
        var vector   = Substitute.For<IVectorMemoryRepository>();
        var meta     = Substitute.For<IMemoryMetadataRepository>();
        var opts     = Options.Create(new MemoryOptions
        {
            MinImportanceThreshold = threshold,
            RetentionDays          = retentionDays,
        });
        var pipeline = new MemoryIngestionPipeline(
            scribe, embedder, vector, meta, opts,
            NullLogger<MemoryIngestionPipeline>.Instance);
        return (pipeline, scribe, embedder, vector, meta);
    }

    private static GeneratedEmbeddings<Embedding<float>> MakeEmbeddings(int count)
    {
        var list = Enumerable.Range(0, count)
            .Select(_ => new Embedding<float>(new float[] { 0.1f, 0.2f, 0.3f }))
            .ToList();
        return new GeneratedEmbeddings<Embedding<float>>(list);
    }


    [Fact]
    public async Task ProcessAsync_NoFactsExtracted_EarlyReturn_NeitherRepoTouched()
    {
        var (pipeline, scribe, _, vector, meta) = Create();
        scribe.ExtractFactsAsync(Arg.Any<MemoryIngestionJob>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<ExtractedFact>());

        await pipeline.ProcessAsync(MakeJob(), CancellationToken.None);

        await vector.DidNotReceiveWithAnyArgs().UpsertBatchAsync(default!, default);
        await meta.DidNotReceiveWithAnyArgs().UpsertBatchAsync(default!, default);
    }


    [Fact]
    public async Task ProcessAsync_AllFactsBelowThreshold_EarlyReturn_NeitherRepoTouched()
    {
        var (pipeline, scribe, _, vector, meta) = Create(threshold: 0.5);
        var lowFacts = new[]
        {
            new ExtractedFact("fact1", "general", [], Importance: 0.2),
            new ExtractedFact("fact2", "general", [], Importance: 0.3),
        };
        scribe.ExtractFactsAsync(Arg.Any<MemoryIngestionJob>(), Arg.Any<CancellationToken>())
            .Returns(lowFacts);

        await pipeline.ProcessAsync(MakeJob(), CancellationToken.None);

        await vector.DidNotReceiveWithAnyArgs().UpsertBatchAsync(default!, default);
        await meta.DidNotReceiveWithAnyArgs().UpsertBatchAsync(default!, default);
    }


    [Fact]
    public async Task ProcessAsync_EligibleFacts_UpsertsBothReposWithCorrectCount()
    {
        var (pipeline, scribe, embedder, vector, meta) = Create(threshold: 0.3);
        var facts = new[]
        {
            new ExtractedFact("user likes cats", "preference", [], Importance: 0.7),
            new ExtractedFact("user is a developer", "role", [], Importance: 0.9),
        };
        scribe.ExtractFactsAsync(Arg.Any<MemoryIngestionJob>(), Arg.Any<CancellationToken>())
            .Returns(facts);
        embedder.GenerateAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<EmbeddingGenerationOptions?>(),
            Arg.Any<CancellationToken>())
            .Returns(MakeEmbeddings(2));

        await pipeline.ProcessAsync(MakeJob(), CancellationToken.None);

        await vector.Received(1).UpsertBatchAsync(
            Arg.Is<IReadOnlyList<VectorUpsertRequest>>(r => r.Count == 2),
            Arg.Any<CancellationToken>());
        await meta.Received(1).UpsertBatchAsync(
            Arg.Is<IReadOnlyList<MemoryMetadata>>(r => r.Count == 2),
            Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task ProcessAsync_PartialFiltering_UpsertsOnlyEligibleFacts()
    {
        var (pipeline, scribe, embedder, vector, meta) = Create(threshold: 0.5);
        var facts = new[]
        {
            new ExtractedFact("high importance", "general", [], Importance: 0.8),
            new ExtractedFact("medium importance", "general", [], Importance: 0.6),
            new ExtractedFact("low importance", "general", [], Importance: 0.2), // below threshold
        };
        scribe.ExtractFactsAsync(Arg.Any<MemoryIngestionJob>(), Arg.Any<CancellationToken>())
            .Returns(facts);
        embedder.GenerateAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<EmbeddingGenerationOptions?>(),
            Arg.Any<CancellationToken>())
            .Returns(MakeEmbeddings(2));

        await pipeline.ProcessAsync(MakeJob(), CancellationToken.None);

        await vector.Received(1).UpsertBatchAsync(
            Arg.Is<IReadOnlyList<VectorUpsertRequest>>(r => r.Count == 2),
            Arg.Any<CancellationToken>());
        await meta.Received(1).UpsertBatchAsync(
            Arg.Is<IReadOnlyList<MemoryMetadata>>(r => r.Count == 2),
            Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task ProcessAsync_EligibleFact_VectorRequestContainsCorrectCardId()
    {
        var (pipeline, scribe, embedder, vector, _) = Create(threshold: 0.3);
        scribe.ExtractFactsAsync(Arg.Any<MemoryIngestionJob>(), Arg.Any<CancellationToken>())
            .Returns(new[] { new ExtractedFact("test fact", "general", [], Importance: 0.8) });
        embedder.GenerateAsync(Arg.Any<IEnumerable<string>>(), Arg.Any<EmbeddingGenerationOptions?>(),
            Arg.Any<CancellationToken>())
            .Returns(MakeEmbeddings(1));

        await pipeline.ProcessAsync(MakeJob(), CancellationToken.None);

        await vector.Received(1).UpsertBatchAsync(
            Arg.Is<IReadOnlyList<VectorUpsertRequest>>(r => r[0].AiCardId == CardId),
            Arg.Any<CancellationToken>());
    }
}
