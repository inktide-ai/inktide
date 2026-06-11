using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.Telemetry;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.Infrastructure.Services;

public sealed class SubscriptionExpiryJob : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly BillingMetrics _metrics;
    private readonly ILogger<SubscriptionExpiryJob> _logger;

    public SubscriptionExpiryJob(
        IServiceScopeFactory scopeFactory,
        BillingMetrics metrics,
        ILogger<SubscriptionExpiryJob> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _metrics      = metrics      ?? throw new ArgumentNullException(nameof(metrics));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var repo  = scope.ServiceProvider.GetRequiredService<ISubscriptionRepository>();
                var count = await repo.ExpireAllOverdueAsync(stoppingToken).ConfigureAwait(false);
                if (count > 0)
                {
                    _metrics.SubscriptionsExpiredTotal.Add(count);
                    _logger.LogInformation(
                        "SubscriptionExpiryJob: expired {Count} overdue subscription(s)", count);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SubscriptionExpiryJob: sweep failed");
            }

            await Task.Delay(Interval, stoppingToken).ConfigureAwait(false);
        }
    }
}
