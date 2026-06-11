using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Aggregation;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.Core;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace Inktide.API.Synapse.Tests.Aggregation;

public sealed class SynapseIngestOrchestratorTests
{

    private static (SynapseIngestOrchestrator Orchestrator,
                    IChannelContextResolutionService ChannelCtx,
                    ISoulRuntime SoulRuntime,
                    ISynapseAggregationService Aggregation)
        Create(IEnumerable<IPipelineStage>? shards = null)
    {
        var channelCtx  = Substitute.For<IChannelContextResolutionService>();
        var soulRuntime = Substitute.For<ISoulRuntime>();
        var aggregation = Substitute.For<ISynapseAggregationService>();
        var orchestrator = new SynapseIngestOrchestrator(
            channelCtx, shards ?? [], aggregation, soulRuntime,
            NullLogger<SynapseIngestOrchestrator>.Instance);
        return (orchestrator, channelCtx, soulRuntime, aggregation);
    }

    private static MessageProcessingContext MakeContext() => new()
    {
        Message = new ChatMessage(
            PlatformId:  "twitch",
            ChannelId:   "channel-1",
            ChannelName: "TestChannel",
            Sender:      new UserMetadata("u1", "TestUser", [], false, false, false, false),
            Text:        "hello",
            Timestamp:   DateTimeOffset.UtcNow),
        CorrelationId = "corr-1",
    };


    [Fact]
    public async Task ProcessAsync_SoulRuntimeEnriched_SkipsShardsAndAggregates()
    {
        var shard = Substitute.For<IPipelineStage>();
        shard.ShardId.Returns("test-shard");
        shard.ShouldRun(Arg.Any<AiCardContext?>()).Returns(true);

        var (orch, _, soulRuntime, aggregation) = Create([shard]);
        var ctx = MakeContext();

        // Simulate SoulRuntime marking context as enriched
        soulRuntime.EnrichAsync(ctx, Arg.Any<CancellationToken>())
            .Returns(x =>
            {
                ((MessageProcessingContext)x[0]).MarkSoulRuntimeExecuted();
                return Task.CompletedTask;
            });

        await orch.ProcessAsync(ctx);

        await shard.DidNotReceive().ProcessAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>());
        await aggregation.Received(1).AggregateAsync(ctx, Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task ProcessAsync_SoulRuntimeNotExecuted_RunsShardsAndAggregates()
    {
        var shard = Substitute.For<IPipelineStage>();
        shard.ShardId.Returns("test-shard");
        shard.ShouldRun(Arg.Any<AiCardContext?>()).Returns(true);
        shard.ProcessAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var (orch, _, _, aggregation) = Create([shard]);
        var ctx = MakeContext();
        // SoulRuntime does nothing (SoulRuntimeExecuted stays false)

        await orch.ProcessAsync(ctx);

        await shard.Received(1).ProcessAsync(ctx, Arg.Any<CancellationToken>());
        await aggregation.Received(1).AggregateAsync(ctx, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProcessAsync_ShardShouldRunFalse_ShardSkipped()
    {
        var shard = Substitute.For<IPipelineStage>();
        shard.ShardId.Returns("conditional-shard");
        shard.ShouldRun(Arg.Any<AiCardContext?>()).Returns(false);

        var (orch, _, _, aggregation) = Create([shard]);
        var ctx = MakeContext();

        await orch.ProcessAsync(ctx);

        await shard.DidNotReceive().ProcessAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>());
        await aggregation.Received(1).AggregateAsync(ctx, Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task ProcessAsync_SoulRuntimeThrows_FallsBackToShards()
    {
        var shard = Substitute.For<IPipelineStage>();
        shard.ShardId.Returns("fallback-shard");
        shard.ShouldRun(Arg.Any<AiCardContext?>()).Returns(true);
        shard.ProcessAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var (orch, _, soulRuntime, aggregation) = Create([shard]);
        soulRuntime.EnrichAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("graph execution failed"));

        var ctx = MakeContext();
        await orch.ProcessAsync(ctx);

        await shard.Received(1).ProcessAsync(ctx, Arg.Any<CancellationToken>());
        await aggregation.Received(1).AggregateAsync(ctx, Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task ProcessAsync_AbortAfterChannelResolution_EarlyReturn_NoAggregation()
    {
        var (orch, channelCtx, _, aggregation) = Create();
        channelCtx.ResolveAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>())
            .Returns(x =>
            {
                ((MessageProcessingContext)x[0]).Abort();
                return Task.CompletedTask;
            });

        var ctx = MakeContext();
        await orch.ProcessAsync(ctx);

        await aggregation.DidNotReceive().AggregateAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task ProcessAsync_ShardTimeout_ContextMarkedDegradedAndAggregationStillRuns()
    {
        var slowShard = Substitute.For<IPipelineStage>();
        slowShard.ShardId.Returns("slow");
        slowShard.ShouldRun(Arg.Any<AiCardContext?>()).Returns(true);
        // Delay longer than the 2500ms shard timeout
        slowShard.ProcessAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>())
            .Returns(async (CallInfo _) => await Task.Delay(TimeSpan.FromSeconds(10)));

        var (orch, _, _, aggregation) = Create([slowShard]);
        var ctx = MakeContext();

        await orch.ProcessAsync(ctx, CancellationToken.None);

        Assert.True(ctx.IsDegraded);
        Assert.Contains("slow", ctx.DegradedShards);
        await aggregation.Received(1).AggregateAsync(ctx, Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task ProcessAsync_ShardThrows_MarkedDegradedAndOtherShardsStillRun()
    {
        var failingShard = Substitute.For<IPipelineStage>();
        failingShard.ShardId.Returns("failing");
        failingShard.ShouldRun(Arg.Any<AiCardContext?>()).Returns(true);
        failingShard.ProcessAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new Exception("shard failed"));

        var goodShard = Substitute.For<IPipelineStage>();
        goodShard.ShardId.Returns("good");
        goodShard.ShouldRun(Arg.Any<AiCardContext?>()).Returns(true);
        goodShard.ProcessAsync(Arg.Any<MessageProcessingContext>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var (orch, _, _, aggregation) = Create([failingShard, goodShard]);
        var ctx = MakeContext();

        await orch.ProcessAsync(ctx);

        Assert.True(ctx.IsDegraded);
        Assert.Contains("failing", ctx.DegradedShards);
        await goodShard.Received(1).ProcessAsync(ctx, Arg.Any<CancellationToken>());
        await aggregation.Received(1).AggregateAsync(ctx, Arg.Any<CancellationToken>());
    }
}
