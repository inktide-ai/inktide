using System.Text;
using System.Text.Json;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.Providers.LemonSqueezy;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using StackExchange.Redis;
using Xunit;

namespace Inktide.API.Billing.Tests.Providers.LemonSqueezy;

public sealed class LemonSqueezyWebhookIdempotencyTests
{
    private static readonly byte[] SampleBody = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
    {
        meta = new
        {
            event_name = "subscription_created",
            custom_data = new { user_id = "user-123" }
        },
        data = new
        {
            id = "sub-456",
            attributes = new
            {
                status = "active",
                customer_id = "cust-789",
                renews_at = "2026-06-22T00:00:00Z"
            }
        }
    }));

    private static (LemonSqueezyWebhookProcessor processor, IDatabase db, ISubscriptionRepository subs)
        CreateProcessor()
    {
        var db = Substitute.For<IDatabase>();
        var redis = Substitute.For<IConnectionMultiplexer>();
        redis.GetDatabase(Arg.Any<int>(), Arg.Any<object>()).Returns(db);

        var subs = Substitute.For<ISubscriptionRepository>();
        subs.GetByUserIdAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns((Billing.Application.Models.UserSubscription?)null);

        var processor = new LemonSqueezyWebhookProcessor(
            subs,
            redis,
            NullLogger<LemonSqueezyWebhookProcessor>.Instance);

        return (processor, db, subs);
    }

    [Fact]
    public async Task FirstEvent_ProcessesAndSetsDoneKey()
    {
        var (processor, db, subs) = CreateProcessor();

        // done-key not present → lock acquired → double-check passes
        db.KeyExistsAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>())
            .Returns(false);
        db.StringSetAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(),
                Arg.Any<TimeSpan?>(), When.NotExists, Arg.Any<CommandFlags>())
            .Returns(true);

        await processor.ProcessAsync(SampleBody);

        await subs.Received(1).UpsertAsync(Arg.Any<Billing.Application.Models.UserSubscription>(), Arg.Any<CancellationToken>());
        // done-key set with 72h TTL after processing
        await db.Received(1).StringSetAsync(
            Arg.Any<RedisKey>(),
            Arg.Any<RedisValue>(),
            Arg.Is<TimeSpan?>(t => t == TimeSpan.FromHours(72)),
            Arg.Any<CommandFlags>());
    }

    [Fact]
    public async Task DuplicateEvent_DoneKeyExists_SkipsProcessing()
    {
        var (processor, db, subs) = CreateProcessor();

        // done-key already present → early return
        db.KeyExistsAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>())
            .Returns(true);

        await processor.ProcessAsync(SampleBody);

        await subs.DidNotReceive().UpsertAsync(Arg.Any<Billing.Application.Models.UserSubscription>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DuplicateEvent_LockNotAcquired_SkipsProcessing()
    {
        var (processor, db, subs) = CreateProcessor();

        db.KeyExistsAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>())
            .Returns(false);
        // another instance holds the lock
        db.StringSetAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(),
                Arg.Any<TimeSpan?>(), When.NotExists, Arg.Any<CommandFlags>())
            .Returns(false);

        await processor.ProcessAsync(SampleBody);

        await subs.DidNotReceive().UpsertAsync(Arg.Any<Billing.Application.Models.UserSubscription>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RedisUnavailable_ProcessesWithoutIdempotency()
    {
        var (processor, db, subs) = CreateProcessor();

        // Redis throws on any operation
        db.KeyExistsAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>())
            .Returns(Task.FromException<bool>(new RedisException("connection refused")));

        await processor.ProcessAsync(SampleBody);

        // fail-open: subscription still upserted
        await subs.Received(1).UpsertAsync(Arg.Any<Billing.Application.Models.UserSubscription>(), Arg.Any<CancellationToken>());
        // no lock to release
        await db.DidNotReceive().KeyDeleteAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>());
    }
}
