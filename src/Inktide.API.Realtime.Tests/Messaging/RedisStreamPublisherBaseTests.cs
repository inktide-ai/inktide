using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Realtime.Infrastructure.Configuration;
using Inktide.API.Realtime.Infrastructure.Hubs;
using Inktide.API.Realtime.Infrastructure.Messaging;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using StackExchange.Redis;
using Xunit;

namespace Inktide.API.Realtime.Tests.Messaging;

public sealed class RedisStreamPublisherBaseTests
{
    // ── Test doubles ──────────────────────────────────────────────────

    private sealed record Payload(
        [property: JsonPropertyName("channelId")] string ChannelId,
        [property: JsonPropertyName("value")]     string Value);

    private sealed class TestSettings : StreamConsumerSettings
    {
        public override string StreamName         { get; set; } = "test-stream";
        public override string ConsumerGroup      { get; set; } = "test-group";
        public override string ConsumerNamePrefix { get; set; } = "test";
    }

    private sealed class FakePublisher : RedisStreamPublisherBase<Payload, TestSettings>
    {
        public List<Payload> Pushed { get; } = new();

        public FakePublisher(
            IConnectionMultiplexer redis,
            IHubContext<AudioHub>  hub,
            IOptions<TestSettings> settings,
            ILogger                logger) : base(redis, hub, settings, logger) { }

        public Task InvokeProcessEntry(IDatabase db, StreamEntry entry, CancellationToken ct = default)
            => ProcessEntryAsync(db, entry, ct);

        protected override Payload? Deserialize(string json)
            => JsonSerializer.Deserialize<Payload>(json);

        protected override bool IsValid(Payload payload)
            => !string.IsNullOrWhiteSpace(payload.Value);

        protected override Task PushToClientsAsync(Payload payload, CancellationToken ct)
        {
            Pushed.Add(payload);
            return Task.CompletedTask;
        }
    }

    private sealed class ThrowingPublisher : RedisStreamPublisherBase<Payload, TestSettings>
    {
        public ThrowingPublisher(
            IConnectionMultiplexer redis,
            IHubContext<AudioHub>  hub,
            IOptions<TestSettings> settings,
            ILogger                logger) : base(redis, hub, settings, logger) { }

        public Task InvokeProcessEntry(IDatabase db, StreamEntry entry, CancellationToken ct = default)
            => ProcessEntryAsync(db, entry, ct);

        protected override Payload? Deserialize(string json)
            => JsonSerializer.Deserialize<Payload>(json);

        protected override bool IsValid(Payload p) => true;

        protected override Task PushToClientsAsync(Payload payload, CancellationToken ct)
            => throw new InvalidOperationException("push failed");
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private static (FakePublisher publisher, IDatabase db) BuildFake()
    {
        var mockDb = Substitute.For<IDatabase>();
        var redis  = Substitute.For<IConnectionMultiplexer>();
        redis.GetDatabase().Returns(mockDb);

        var publisher = new FakePublisher(
            redis,
            Substitute.For<IHubContext<AudioHub>>(),
            Options.Create(new TestSettings()),
            Substitute.For<ILogger>());

        return (publisher, mockDb);
    }

    private static StreamEntry EntryWith(string field, string value)
        => new("1-0", [new NameValueEntry(field, value)]);

    private static StreamEntry EntryWithoutPayload()
        => new("1-0", [new NameValueEntry("other-field", "x")]);

    // ── ProcessEntryAsync tests ───────────────────────────────────────

    [Fact]
    public async Task ProcessEntry_MissingPayloadField_AcksWithoutPushing()
    {
        var (publisher, db) = BuildFake();

        await publisher.InvokeProcessEntry(db, EntryWithoutPayload());

        Assert.Empty(publisher.Pushed);
        await db.Received(1).StreamAcknowledgeAsync(
            Arg.Any<RedisKey>(), Arg.Any<RedisValue>(), Arg.Any<RedisValue>(), Arg.Any<CommandFlags>());
    }

    [Fact]
    public async Task ProcessEntry_MalformedJson_AcksWithoutPushing()
    {
        var (publisher, db) = BuildFake();

        await publisher.InvokeProcessEntry(db, EntryWith("payload", "not-json{{{"));

        Assert.Empty(publisher.Pushed);
        await db.Received(1).StreamAcknowledgeAsync(
            Arg.Any<RedisKey>(), Arg.Any<RedisValue>(), Arg.Any<RedisValue>(), Arg.Any<CommandFlags>());
    }

    [Fact]
    public async Task ProcessEntry_IsValidReturnsFalse_AcksWithoutPushing()
    {
        var (publisher, db) = BuildFake();
        // IsValid checks that Value is not whitespace-only
        var entry = EntryWith("payload", """{"channelId":"ch1","value":"   "}""");

        await publisher.InvokeProcessEntry(db, entry);

        Assert.Empty(publisher.Pushed);
        await db.Received(1).StreamAcknowledgeAsync(
            Arg.Any<RedisKey>(), Arg.Any<RedisValue>(), Arg.Any<RedisValue>(), Arg.Any<CommandFlags>());
    }

    [Fact]
    public async Task ProcessEntry_ValidPayload_PushesAndAcks()
    {
        var (publisher, db) = BuildFake();
        var entry = EntryWith("payload", """{"channelId":"ch1","value":"hello"}""");

        await publisher.InvokeProcessEntry(db, entry);

        Assert.Single(publisher.Pushed);
        Assert.Equal("ch1", publisher.Pushed[0].ChannelId);
        Assert.Equal("hello", publisher.Pushed[0].Value);
        await db.Received(1).StreamAcknowledgeAsync(
            Arg.Any<RedisKey>(), Arg.Any<RedisValue>(), Arg.Any<RedisValue>(), Arg.Any<CommandFlags>());
    }

    [Fact]
    public async Task ProcessEntry_PushThrows_StillAcks()
    {
        var mockDb = Substitute.For<IDatabase>();
        var redis  = Substitute.For<IConnectionMultiplexer>();
        redis.GetDatabase().Returns(mockDb);

        var publisher = new ThrowingPublisher(
            redis,
            Substitute.For<IHubContext<AudioHub>>(),
            Options.Create(new TestSettings()),
            Substitute.For<ILogger>());

        var entry = EntryWith("payload", """{"channelId":"ch1","value":"hello"}""");

        await publisher.InvokeProcessEntry(mockDb, entry);

        await mockDb.Received(1).StreamAcknowledgeAsync(
            Arg.Any<RedisKey>(), Arg.Any<RedisValue>(), Arg.Any<RedisValue>(), Arg.Any<CommandFlags>());
    }

    // ── ResolveInstanceId tests ───────────────────────────────────────

    [Fact]
    public void ResolveInstanceId_DotnetHostnameEnvSet_ReturnsThatValue()
    {
        Environment.SetEnvironmentVariable("DOTNET_HOSTNAME", "test-pod-1");
        try
        {
            var id = RedisStreamPublisherBase<Payload, TestSettings>.ResolveInstanceId();
            Assert.Equal("test-pod-1", id);
        }
        finally
        {
            Environment.SetEnvironmentVariable("DOTNET_HOSTNAME", null);
        }
    }

    [Fact]
    public void ResolveInstanceId_NoEnvVars_ReturnsFallback8CharId()
    {
        Environment.SetEnvironmentVariable("DOTNET_HOSTNAME", null);
        Environment.SetEnvironmentVariable("HOSTNAME",        null);
        Environment.SetEnvironmentVariable("K8S_POD_NAME",   null);
        try
        {
            var id = RedisStreamPublisherBase<Payload, TestSettings>.ResolveInstanceId();
            Assert.NotEmpty(id);
            Assert.Equal(8, id.Length);
        }
        finally
        {
            // restore HOSTNAME from system (it was null-ed above; OS value is gone for this process)
        }
    }
}
