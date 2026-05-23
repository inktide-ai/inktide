using Inktide.API.Core;
using Inktide.API.Profile.Infrastructure.DbContext;
using Inktide.API.Profile.Infrastructure.Keycloak;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Profile.Infrastructure.DependencyInjection;

public sealed class ProfileInfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = ctx.Configuration.GetConnectionString("Postgres")
            ?? BuildConnectionString(ctx.Configuration);

        services.AddDbContext<ProfileDbContext>(options => options.UseNpgsql(connectionString));
        services.AddHostedService<ProfileDbInitializer>();

        services.AddHttpClient(nameof(KeycloakAdminClient), client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });
    }

    private static string BuildConnectionString(IConfiguration cfg)
    {
        var host     = cfg["PostgresSettings:Host"]     ?? "localhost";
        var port     = cfg["PostgresSettings:Port"]     ?? "5432";
        var db       = cfg["PostgresSettings:Database"] ?? "inktide";
        var username = cfg["PostgresSettings:Username"] ?? throw new InvalidOperationException("PostgresSettings:Username required");
        var password = cfg["PostgresSettings:Password"] ?? throw new InvalidOperationException("PostgresSettings:Password required");
        return $"Host={host};Port={port};Database={db};Username={username};Password={password}";
    }
}
