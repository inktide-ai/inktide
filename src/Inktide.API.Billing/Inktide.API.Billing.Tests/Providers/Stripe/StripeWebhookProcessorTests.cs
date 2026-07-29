using System.Text;
using System.Text.Json;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Messages;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.DbContext;
using Inktide.API.Billing.Infrastructure.Providers.Stripe;
using Inktide.API.Billing.Infrastructure.Settings;
using Inktide.API.Billing.Infrastructure.Telemetry;
using Inktide.API.Core.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using StackExchange.Redis;
using Xunit;

namespace Inktide.API.Billing.Tests.Providers.Stripe;

public sealed class StripeWebhookProcessorTests
{
    private const string UserId = "user-test-1";
    private const string PaymentIntentId = "pi_test_123";


    private static (StripeWebhookProcessor Processor,
                    ISubscriptionRepository Subs,
                    IPublishEndpoint Publish,
                    IDatabase Db)
        Create(TimeProvider? time = null)
    {
        var settings = new StripeSettings { WebhookSecret = "whsec_test", SecretKey = "sk_test" };
        var subs     = Substitute.For<ISubscriptionRepository>();
        var publish  = Substitute.For<IPublishEndpoint>();
        var db       = Substitute.For<IDatabase>();
        var redis    = Substitute.For<IConnectionMultiplexer>();
        redis.GetDatabase(Arg.Any<int>(), Arg.Any<object?>()).Returns(db);

        // Idempotency guard: not yet processed
        db.KeyExistsAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>()).Returns(false);
        // Lock acquisition: 4-param overload StringSetAsync(key, value, expiry, When) used by idempotency guard
        db.StringSetAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(),
            Arg.Any<TimeSpan?>(), Arg.Any<When>()).Returns(true);
        // Lock acquisition: 5-param overload (with CommandFlags)
        db.StringSetAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(),
            Arg.Any<TimeSpan?>(), Arg.Any<When>(), Arg.Any<CommandFlags>()).Returns(true);
        // Mark done: 6-param overload StringSetAsync(key, value, expiry, keepTtl, When, flags)
        db.StringSetAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(),
            Arg.Any<TimeSpan?>(), Arg.Any<bool>(), Arg.Any<When>(), Arg.Any<CommandFlags>()).Returns(true);
        // Lock release
        db.KeyDeleteAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>()).Returns(true);

        var dbCtx     = new BillingDbContext(new DbContextOptionsBuilder<BillingDbContext>()
                            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var incidents = Substitute.For<IBillingIncidentRepository>();

        var processor = new StripeWebhookProcessor(settings, subs, incidents, publish, dbCtx, redis,
            time ?? TimeProvider.System, new BillingMetrics(), NullLogger<StripeWebhookProcessor>.Instance);
        return (processor, subs, publish, db);
    }

    private static byte[] BuildEvent(
        string eventType,
        string? userId = UserId,
        string? piId = PaymentIntentId,
        string plan = "pro",
        string? receiptEmail = null)
    {
        var metadata = new Dictionary<string, object?>();
        if (userId is not null) metadata["user_id"] = userId;
        metadata["plan"] = plan;

        var obj = new Dictionary<string, object?>
        {
            ["id"]       = piId,
            ["metadata"] = metadata,
        };
        if (receiptEmail is not null) obj["receipt_email"] = receiptEmail;

        var payload = new Dictionary<string, object?>
        {
            ["id"]   = "evt_test_1",
            ["type"] = eventType,
            ["data"] = new Dictionary<string, object?> { ["object"] = obj },
        };

        return Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
    }


    [Fact]
    public async Task PaymentSucceeded_SetsActiveSubscription()
    {
        var (p, subs, _, _) = Create();
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSubscription?)null);

        await p.ProcessAsync(BuildEvent("payment_intent.succeeded", plan: "pro"));

        await subs.Received(1).UpsertAsync(
            Arg.Is<UserSubscription>(s =>
                s.Status == SubStatus.Active &&
                s.Plan   == PlanType.Pro     &&
                s.Provider == "stripe"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PaymentSucceeded_StarterPlan_SetsPlanTypeStarter()
    {
        var (p, subs, _, _) = Create();
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSubscription?)null);

        await p.ProcessAsync(BuildEvent("payment_intent.succeeded", plan: "starter"));

        await subs.Received(1).UpsertAsync(
            Arg.Is<UserSubscription>(s => s.Plan == PlanType.Starter),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PaymentSucceeded_WithReceiptEmail_PublishesReceiptMessage()
    {
        var (p, subs, publish, _) = Create();
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSubscription?)null);

        await p.ProcessAsync(BuildEvent("payment_intent.succeeded", receiptEmail: "user@example.com"));

        await publish.Received(1).Publish(
            Arg.Is<PaymentReceiptEmailMessage>(m =>
                m.UserEmail == "user@example.com" && m.Provider == "Stripe"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PaymentSucceeded_NoReceiptEmail_DoesNotPublishReceiptMessage()
    {
        var (p, subs, publish, _) = Create();
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSubscription?)null);

        await p.ProcessAsync(BuildEvent("payment_intent.succeeded", receiptEmail: null));

        await publish.DidNotReceive().Publish(Arg.Any<PaymentReceiptEmailMessage>(), Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task PaymentFailed_SetsPastDue()
    {
        var (p, subs, _, _) = Create();
        var existing = new UserSubscription { UserId = UserId, Plan = PlanType.Pro, Status = SubStatus.Active };
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns(existing);

        await p.ProcessAsync(BuildEvent("payment_intent.payment_failed"));

        await subs.Received(1).UpsertAsync(
            Arg.Is<UserSubscription>(s => s.Status == SubStatus.PastDue),
            Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task SubscriptionDeleted_SetsCancelledAndFree()
    {
        var (p, subs, _, _) = Create();
        var existing = new UserSubscription { UserId = UserId, Plan = PlanType.Pro, Status = SubStatus.Active };
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns(existing);

        await p.ProcessAsync(BuildEvent("customer.subscription.deleted"));

        await subs.Received(1).UpsertAsync(
            Arg.Is<UserSubscription>(s =>
                s.Status == SubStatus.Cancelled &&
                s.Plan   == PlanType.Free),
            Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task MissingPlanMetadata_EarlyReturn_NoUpsert()
    {
        var (p, subs, _, _) = Create();
        // Build event without plan in metadata
        var payload = new
        {
            id   = "evt_test_1",
            type = "payment_intent.succeeded",
            data = new
            {
                @object = new
                {
                    id       = PaymentIntentId,
                    metadata = new { user_id = UserId },  // no "plan"
                }
            }
        };
        var raw = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));

        await p.ProcessAsync(raw);

        await subs.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default);
    }


    [Fact]
    public async Task MissingUserIdInMetadata_FallsBackToProviderSubIdLookup()
    {
        var (p, subs, _, _) = Create();
        var existing = new UserSubscription { UserId = UserId, Plan = PlanType.Pro };
        // No userId in metadata -> fallback to GetByProviderSubIdAsync
        subs.GetByProviderSubIdAsync(PaymentIntentId, Arg.Any<CancellationToken>()).Returns(existing);
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns(existing);

        var payload = new
        {
            id   = "evt_test_1",
            type = "payment_intent.succeeded",
            data = new
            {
                @object = new
                {
                    id       = PaymentIntentId,
                    metadata = new { plan = "pro" },  // no "user_id"
                }
            }
        };
        var raw = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));

        await p.ProcessAsync(raw);

        await subs.Received(1).UpsertAsync(Arg.Any<UserSubscription>(), Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task UnhandledEventType_EarlyReturn_NoUpsert()
    {
        var (p, subs, _, _) = Create();

        await p.ProcessAsync(BuildEvent("charge.refunded"));

        await subs.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default);
    }


    [Fact]
    public async Task AlreadyProcessed_IdempotencyGuardSkips_NoUpsert()
    {
        var (p, subs, _, db) = Create();
        // Override: doneKey exists -> already processed
        db.KeyExistsAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>()).Returns(true);

        await p.ProcessAsync(BuildEvent("payment_intent.succeeded"));

        await subs.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default);
    }
}
