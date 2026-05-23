using Inktide.API.Core;
using Inktide.API.Core.Contracts;
using Inktide.API.Graph.Application.Interfaces;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Registry;
using Inktide.API.Graph.Domain.Providers;
using Inktide.API.Graph.Infrastructure.DbContext;

using Inktide.API.Graph.Infrastructure.Execution;
using Inktide.API.Graph.Infrastructure.Handlers;
using Inktide.API.Graph.Infrastructure.Registry;
using Inktide.API.Graph.Infrastructure.Repositories;
using Inktide.API.Graph.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Graph.Infrastructure.DependencyInjection;

public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        var connectionString = ResolveConnectionString(ctx.Configuration);

        services.AddDbContext<GraphDbContext>(options => options.UseNpgsql(connectionString));

        // Node provider catalog (metadata, used by REST endpoint for the UI sidebar)
        services.AddSingleton<INodeProvider, InputNodeProvider>();
        services.AddSingleton<INodeProvider, DiscordInputNodeProvider>();
        services.AddSingleton<INodeProvider, TwitchInputNodeProvider>();
        services.AddSingleton<INodeProvider, TelegramInputNodeProvider>();
        services.AddSingleton<INodeProvider, LlmNodeProvider>();
        services.AddSingleton<INodeProvider, TtsNodeProvider>();
        services.AddSingleton<INodeProvider, OutputNodeProvider>();
        services.AddSingleton<INodeProviderRegistry>(sp =>
            new NodeProviderRegistry(sp.GetServices<INodeProvider>()));

        // Node handlers (execution)
        services.AddSingleton<INodeHandler, InputNodeHandler>();
        services.AddSingleton<INodeHandler, ContextBuilderNodeHandler>();
        services.AddSingleton<INodeHandler, DiscordInputNodeHandler>();
        services.AddSingleton<INodeHandler, TwitchInputNodeHandler>();
        services.AddSingleton<INodeHandler, TelegramInputNodeHandler>();
        services.AddSingleton<INodeHandler, LlmNodeHandler>();
        services.AddSingleton<INodeHandler, TtsNodeHandler>();
        services.AddSingleton<INodeHandler, OutputNodeHandler>();
        services.AddSingleton<INodeHandler, EmotionNodeHandler>();
        services.AddSingleton<INodeHandler, MemoryNodeHandler>();
        services.AddSingleton<INodeHandler, FilterNodeHandler>();
        services.AddSingleton<INodeHandler, PromptNodeHandler>();
        services.AddSingleton<INodeHandlerRegistry>(sp =>
            new NodeHandlerRegistry(sp.GetServices<INodeHandler>()));

        // Core services
        services.AddScoped<IGraphRepository, GraphRepository>();
        services.AddScoped<IGraphService, GraphService>();
        services.AddSingleton<IGraphExecutor, GraphExecutorService>();
        services.AddScoped<IGraphDefinitionImporter, GraphDefinitionImporterService>();

        services.AddHostedService<GraphDatabaseMigrationService>();
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        var fullOverride = configuration.GetConnectionString("Postgres");
        if (!string.IsNullOrWhiteSpace(fullOverride))
            return fullOverride.Trim();

        var host = configuration["PostgresSettings:Host"] ?? "localhost";
        var port = configuration["PostgresSettings:Port"] ?? "5432";
        var db = configuration["PostgresSettings:Database"] ?? "inktide";
        var user = configuration["PostgresSettings:Username"] ?? "inktide";
        var pass = configuration["PostgresSettings:Password"]
            ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
            ?? string.Empty;

        if (string.IsNullOrEmpty(pass))
            throw new InvalidOperationException(
                "PostgreSQL password is not configured. Set PostgresSettings:Password, " +
                "POSTGRES_PASSWORD, or ConnectionStrings:Postgres.");

        return $"Host={host};Port={port};Database={db};Username={user};Password={pass};" +
               "Pooling=true;Minimum Pool Size=10;Maximum Pool Size=200";
    }
}
