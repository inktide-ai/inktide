using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Developer.Infrastructure.Persistence;

internal sealed class DeveloperDbInitializer(
    IServiceProvider services,
    ILogger<DeveloperDbInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DeveloperDbContext>();

        logger.LogInformation("Applying Developer DB migrations…");
        await db.Database.MigrateAsync(ct);
        logger.LogInformation("Developer DB migrations applied.");
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
