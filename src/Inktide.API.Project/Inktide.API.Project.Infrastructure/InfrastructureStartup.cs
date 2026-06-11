using Inktide.API.Core;
using Inktide.API.Core.Contracts;
using Inktide.API.Core.Storage;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Project.Infrastructure.DependencyInjection;
using Inktide.API.Project.Infrastructure.Persistence;
using Inktide.API.Project.Infrastructure.Persistence.Repositories;
using Inktide.API.Project.Infrastructure.Services;
using Inktide.API.Project.Infrastructure.Transactions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Project.Infrastructure;

public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = ResolveConnectionString(ctx.Configuration);

        // ObjectStorageSettings is also registered by Soul.Application via DryIoc,
        // but ProjectSceneService is resolved through MS DI and needs it available here too.
        var storageSettings = new ObjectStorageSettings();
        ctx.Configuration.GetSection("S3Settings").Bind(storageSettings);
        services.AddSingleton(storageSettings);

        services.AddDbContext<ProjectDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        services.AddSingleton(TimeProvider.System);
        services.AddScoped<ProjectTransactionManager>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<ProjectService>(sp => new ProjectService(
            sp.GetRequiredService<IProjectRepository>(),
            sp.GetRequiredService<ProjectTransactionManager>(),
            sp.GetRequiredService<TimeProvider>()));
        services.AddScoped<IProjectCrudService>(sp => sp.GetRequiredService<ProjectService>());
        services.AddScoped<IProjectOrderingService>(sp => sp.GetRequiredService<ProjectService>());
        services.AddScoped<IProjectPluginService>(sp => sp.GetRequiredService<ProjectService>());
        services.AddScoped<IProjectSceneConfigService>(sp => sp.GetRequiredService<ProjectService>());
        services.AddScoped<IProjectToolRepository, ProjectToolRepository>();
        services.AddScoped<IProjectToolService, ProjectToolService>();
        services.AddScoped<IProjectSceneRepository, ProjectSceneRepository>();
        services.AddScoped<IProjectSceneService, ProjectSceneService>();
        services.AddScoped<IProjectChannelRepository, ProjectChannelRepository>();
        services.AddScoped<IProjectChannelService, ProjectChannelService>();
        services.AddScoped<IProjectRunPresetRepository, ProjectRunPresetRepository>();
        services.AddScoped<IProjectRunPresetService, ProjectRunPresetService>();
        services.AddScoped<ILocalTtsProviderClassifier, LocalTtsProviderClassifier>();
        services.AddScoped<IProjectImportService, ProjectImportService>();
        services.AddScoped<IProjectBySoulQuery, ProjectBySoulQueryService>();
        services.AddScoped<IProjectExportService, ProjectExportService>();
        services.AddScoped<IInktFileImportService, InktFileImportService>();

        // IDistributedCache backed by Redis for parse-token storage between import phases.
        // If Redis is not configured, fall back to in-memory (single-instance only).
        var redisConn = ctx.Configuration.GetConnectionString("Redis")
            ?? ctx.Configuration["RedisSettings:ConnectionString"]
            ?? ctx.Configuration["Redis:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(redisConn))
        {
            services.AddStackExchangeRedisCache(opts => opts.Configuration = redisConn);
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        services.AddHostedService<DatabaseMigrationService>();

        services
            .AddHealthChecks()
            .AddNpgSql(connectionString, name: "project-postgres", failureStatus: HealthStatus.Degraded, tags: ["ready"]);
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        var fullOverride = configuration.GetConnectionString("Postgres");
        if (!string.IsNullOrWhiteSpace(fullOverride))
            return fullOverride.Trim();

        // Reuse the same PostgresSettings that Soul uses — projects share the same DB instance.
        var host     = configuration["PostgresSettings:Host"]     ?? "localhost";
        var port     = configuration["PostgresSettings:Port"]     ?? "5432";
        var database = configuration["PostgresSettings:Database"] ?? "inktide";
        var username = configuration["PostgresSettings:Username"] ?? "postgres";
        var password = configuration["PostgresSettings:Password"]
            ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
            ?? throw new InvalidOperationException("PostgreSQL password is not configured.");

        return $"Host={host};Port={port};Database={database};Username={username};Password={password}";
    }
}
