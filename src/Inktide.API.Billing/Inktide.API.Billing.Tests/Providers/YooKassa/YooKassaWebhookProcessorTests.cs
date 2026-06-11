using System.Net;
using System.Text;
using System.Text.Json;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.DbContext;
using Inktide.API.Billing.Infrastructure.Providers.YooKassa;
using Inktide.API.Billing.Infrastructure.Settings;
using Inktide.API.Billing.Infrastructure.Telemetry;
using Inktide.API.Core.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using StackExchange.Redis;
using Xunit;

namespace Inktide.API.Billing.Tests.Providers.YooKassa;

public sealed class YooKassaWebhookProcessorTests
{
    private const string UserId    = "user-yk-1";
    private const string PaymentId = "12345678-1234-1234-1234-123456789012"; // valid UUID


    private sealed class FakeHandler(string json, HttpStatusCode code = HttpStatusCode.OK)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage _, CancellationToken __)
            => Task.FromResult(new HttpResponseMessage(code)
               { Content = new StringContent(json, Encoding.UTF8, "application/json") });
    }


    private static (YooKassaWebhookProcessor Processor, ISubscriptionRepository Subs, IDatabase Db)
        Create(string? fetchJson = null, HttpStatusCode fetchStatus = HttpStatusCode.OK)
    {
        var json     = fetchJson ?? BuildPaymentJson(PaymentId, "succeeded", UserId, "pro");
        var http     = new HttpClient(new FakeHandler(json, fetchStatus))
                       { BaseAddress = new Uri("https://api.yookassa.ru") };
        var settings = new YooKassaSettings();
        var subs     = Substitute.For<ISubscriptionRepository>();
        var db       = Substitute.For<IDatabase>();
        var redis    = Substitute.For<IConnectionMultiplexer>();
        redis.GetDatabase(Arg.Any<int>(), Arg.Any<object?>()).Returns(db);

        // Idempotency guard: not yet processed
        db.KeyExistsAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>()).Returns(false);
        // Lock acquisition: 4-param overload used by idempotency guard
        db.StringSetAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(),
            Arg.Any<TimeSpan?>(), Arg.Any<When>()).Returns(true);
        // Lock acquisition: 5-param overload (with CommandFlags)
        db.StringSetAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(),
            Arg.Any<TimeSpan?>(), Arg.Any<When>(), Arg.Any<CommandFlags>()).Returns(true);
        // Mark done: 6-param overload
        db.StringSetAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(),
            Arg.Any<TimeSpan?>(), Arg.Any<bool>(), Arg.Any<When>(), Arg.Any<CommandFlags>()).Returns(true);
        db.KeyDeleteAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>()).Returns(true);

        var publish    = Substitute.For<IPublishEndpoint>();
        var incidents  = Substitute.For<IBillingIncidentRepository>();
        var dbCtx      = new BillingDbContext(new DbContextOptionsBuilder<BillingDbContext>()
                             .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var processor = new YooKassaWebhookProcessor(http, settings, subs, incidents, publish, dbCtx, redis,
            TimeProvider.System, new BillingMetrics(), NullLogger<YooKassaWebhookProcessor>.Instance);
        return (processor, subs, db);
    }

    private static string BuildPaymentJson(
        string paymentId,
        string status,
        string userId,
        string plan,
        string? paymentMethodId = "pm_test_1")
    {
        var obj = new Dictionary<string, object?>
        {
            ["id"]     = paymentId,
            ["status"] = status,
            ["metadata"] = new Dictionary<string, string>
            {
                ["user_id"] = userId,
                ["plan"]    = plan,
            },
        };
        if (paymentMethodId is not null)
            obj["payment_method"] = new Dictionary<string, string> { ["id"] = paymentMethodId };
        return JsonSerializer.Serialize(obj);
    }

    private static byte[] BuildWebhook(string paymentId, string eventName)
    {
        var payload = new Dictionary<string, object?>
        {
            ["event"]  = eventName,
            ["object"] = new Dictionary<string, string> { ["id"] = paymentId },
        };
        return Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
    }


    [Fact]
    public async Task PaymentSucceeded_SetsActiveSubscription()
    {
        var (p, subs, _) = Create();
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSubscription?)null);

        await p.ProcessAsync(BuildWebhook(PaymentId, "payment.succeeded"));

        await subs.Received(1).UpsertAsync(
            Arg.Is<UserSubscription>(s =>
                s.Status   == SubStatus.Active  &&
                s.Plan     == PlanType.Pro      &&
                s.Provider == "yookassa"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task PaymentSucceeded_StarterPlan_SetsPlanTypeStarter()
    {
        var json = BuildPaymentJson(PaymentId, "succeeded", UserId, "starter");
        var (p, subs, _) = Create(fetchJson: json);
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSubscription?)null);

        await p.ProcessAsync(BuildWebhook(PaymentId, "payment.succeeded"));

        await subs.Received(1).UpsertAsync(
            Arg.Is<UserSubscription>(s => s.Plan == PlanType.Starter),
            Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task PaymentCanceled_SetsCancelledAndFree()
    {
        var json = BuildPaymentJson(PaymentId, "canceled", UserId, "pro");
        var (p, subs, _) = Create(fetchJson: json);
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSubscription?)null);

        await p.ProcessAsync(BuildWebhook(PaymentId, "payment.canceled"));

        await subs.Received(1).UpsertAsync(
            Arg.Is<UserSubscription>(s =>
                s.Status == SubStatus.Cancelled &&
                s.Plan   == PlanType.Free),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task StaleCancelGuard_ActiveSubWithDifferentPaymentId_Skips()
    {
        var json = BuildPaymentJson(PaymentId, "canceled", UserId, "pro");
        var (p, subs, _) = Create(fetchJson: json);

        // Active subscription was renewed by a different payment
        var existing = new UserSubscription
        {
            UserId             = UserId,
            Status             = SubStatus.Active,
            ProviderCustomerId = "different-payment-id",
        };
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns(existing);

        await p.ProcessAsync(BuildWebhook(PaymentId, "payment.canceled"));

        await subs.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default);
    }


    [Fact]
    public async Task RefundSucceeded_SetsCancelledAndFree()
    {
        var json = BuildPaymentJson(PaymentId, "canceled", UserId, "pro");
        var (p, subs, _) = Create(fetchJson: json);
        subs.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns((UserSubscription?)null);

        await p.ProcessAsync(BuildWebhook(PaymentId, "refund.succeeded"));

        await subs.Received(1).UpsertAsync(
            Arg.Is<UserSubscription>(s => s.Status == SubStatus.Cancelled),
            Arg.Any<CancellationToken>());
    }


    [Fact]
    public async Task InvalidPaymentId_NotAUuid_EarlyReturn()
    {
        var (p, subs, _) = Create();

        await p.ProcessAsync(BuildWebhook("not-a-uuid", "payment.succeeded"));

        await subs.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default);
    }


    [Fact]
    public async Task FetchPaymentFails_Throws_NoUpsert()
    {
        // 5xx from YooKassa re-fetch throws so the caller (webhook handler) can retry delivery.
        var (p, subs, _) = Create(fetchStatus: HttpStatusCode.InternalServerError);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            p.ProcessAsync(BuildWebhook(PaymentId, "payment.succeeded")));

        await subs.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default);
    }


    [Fact]
    public async Task AlreadyProcessed_IdempotencyGuardSkips_NoUpsert()
    {
        var (p, subs, db) = Create();
        db.KeyExistsAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>()).Returns(true);

        await p.ProcessAsync(BuildWebhook(PaymentId, "payment.succeeded"));

        await subs.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default);
    }


    [Fact]
    public async Task PaymentSucceeded_MissingPlanMetadata_EarlyReturn()
    {
        var json = JsonSerializer.Serialize(new
        {
            id       = PaymentId,
            status   = "succeeded",
            metadata = new { user_id = UserId }, // no "plan"
        });
        var (p, subs, _) = Create(fetchJson: json);

        await p.ProcessAsync(BuildWebhook(PaymentId, "payment.succeeded"));

        await subs.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default);
    }
}
