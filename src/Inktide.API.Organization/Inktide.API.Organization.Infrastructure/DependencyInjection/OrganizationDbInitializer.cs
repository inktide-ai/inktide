using Inktide.API.Organization.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Organization.Infrastructure.DependencyInjection;

public sealed class OrganizationDbInitializer : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrganizationDbInitializer> _logger;

    public OrganizationDbInitializer(
        IServiceScopeFactory scopeFactory,
        ILogger<OrganizationDbInitializer> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<OrganizationDbContext>();
            await db.Database.ExecuteSqlRawAsync("CREATE SCHEMA IF NOT EXISTS organization", ct);
            await db.Database.MigrateAsync(ct);
            _logger.LogInformation("Organization schema initialized.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Organization schema initialization failed.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
