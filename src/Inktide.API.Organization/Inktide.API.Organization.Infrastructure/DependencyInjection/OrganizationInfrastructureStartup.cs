using Inktide.API.Core;
using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Infrastructure.DbContext;
using Inktide.API.Organization.Infrastructure.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Organization.Infrastructure.DependencyInjection;

public sealed class OrganizationInfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connStr = BuildConnectionString(ctx.Configuration);
        services.AddDbContext<OrganizationDbContext>(opts =>
            opts.UseNpgsql(connStr, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_org_migrations", "organization")));

        services.AddHostedService<OrganizationDbInitializer>();
        services.AddHostedService<Messaging.UserAccountDeletedConsumer>();
        services.AddSingleton<IInviteAttemptTracker, RedisInviteAttemptTracker>();
    }

    private static string BuildConnectionString(IConfiguration config)
    {
        var cs = config.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(cs)) return cs;

        var host = config["PostgresSettings:Host"] ?? "localhost";
        var port = config["PostgresSettings:Port"] ?? "5432";
        var db   = config["PostgresSettings:Database"] ?? "inktide";
        var user = config["PostgresSettings:Username"] ?? "inktide-admin";
        var pass = config["PostgresSettings:Password"] ?? "";
        return $"Host={host};Port={port};Database={db};Username={user};Password={pass}";
    }
}
