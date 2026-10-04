using Inktide.API.Billing.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.Infrastructure.DependencyInjection;

/// <summary>
/// Applies pending BillingDbContext migrations on startup, like the other contexts' initializers.
/// Registered ahead of the billing jobs so their first sweep finds the billing schema in place.
/// </summary>
internal sealed class BillingDbInitializer(
    IServiceScopeFactory scopeFactory,
    ILogger<BillingDbInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<BillingDbContext>();

        await db.Database.MigrateAsync(cancellationToken);

        logger.LogInformation("BillingDbContext initialized (billing schema ready)");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
