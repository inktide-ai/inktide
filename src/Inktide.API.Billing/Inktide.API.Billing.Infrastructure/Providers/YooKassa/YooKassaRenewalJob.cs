using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Messages;
using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Billing.Infrastructure.Providers.YooKassa;

public sealed class YooKassaRenewalJob : BackgroundService
{
    private static readonly TimeSpan Interval       = TimeSpan.FromHours(6);
    private static readonly TimeSpan RenewalHorizon = TimeSpan.FromDays(3);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConnectionMultiplexer _redis;
    private readonly TimeProvider _time;
    private readonly ILogger<YooKassaRenewalJob> _logger;

    public YooKassaRenewalJob(
        IServiceScopeFactory scopeFactory,
        IConnectionMultiplexer redis,
        TimeProvider time,
        ILogger<YooKassaRenewalJob> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _redis        = redis        ?? throw new ArgumentNullException(nameof(redis));
        _time         = time         ?? throw new ArgumentNullException(nameof(time));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCycleAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "YooKassaRenewalJob: cycle failed");
            }

            await Task.Delay(Interval, stoppingToken).ConfigureAwait(false);
        }
    }

    private async Task RunCycleAsync(CancellationToken ct)
    {
        var horizon = _time.GetUtcNow().UtcDateTime.Add(RenewalHorizon);
        var db      = _redis.GetDatabase();

        await using var scope   = _scopeFactory.CreateAsyncScope();
        var repo                = scope.ServiceProvider.GetRequiredService<ISubscriptionRepository>();
        var publishEndpoint     = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        var due = await repo.GetDueForRenewalAsync("yookassa", horizon, ct).ConfigureAwait(false);

        if (due.Count > 0)
            _logger.LogInformation("YooKassaRenewalJob: {Count} subscription(s) due for renewal", due.Count);

        var toMark = new List<string>(due.Count);

        foreach (var sub in due)
        {
            var periodUnix = ((DateTimeOffset)sub.CurrentPeriodEnd!.Value).ToUnixTimeSeconds();
            var idempKey   = $"billing:renewal:attempt:{sub.UserId}:{periodUnix}";

            if (await db.KeyExistsAsync(idempKey).ConfigureAwait(false))
            {
                _logger.LogDebug(
                    "YooKassaRenewalJob: skip user {UserId}, already queued for period {End}",
                    sub.UserId, sub.CurrentPeriodEnd);
                continue;
            }

            await publishEndpoint.Publish(
                new YooKassaRenewalRequestedMessage(
                    sub.UserId,
                    sub.ProviderSubId ?? string.Empty,
                    sub.Plan.ToString(),
                    sub.CurrentPeriodEnd.Value),
                ct).ConfigureAwait(false);

            toMark.Add(idempKey);
        }

        // Flush all outbox rows in a single SaveChanges - BillingDbContext is resolved from the same scope.
        if (toMark.Count > 0)
        {
            var dbCtx = scope.ServiceProvider
                .GetRequiredService<Inktide.API.Billing.Infrastructure.DbContext.BillingDbContext>();
            await dbCtx.SaveChangesAsync(ct).ConfigureAwait(false);

            foreach (var key in toMark)
                await db.StringSetAsync(key, "queued", TimeSpan.FromHours(48)).ConfigureAwait(false);

            _logger.LogInformation("YooKassaRenewalJob: queued {Count} renewal message(s)", toMark.Count);
        }
    }
}
