using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Chimera.ApiGateway.Application.Contracts.Streaming;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Discord.Health;
using Chimera.ApiGateway.Discord.Settings;

namespace Chimera.ApiGateway.Discord;

/// <summary>
/// Registers Discord connector (IChatConnector) — Gateway WebSocket via Discord.Net.
/// </summary>
public sealed class DiscordStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<DiscordSettings>()
            .BindConfiguration(nameof(DiscordSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton<DiscordMessageMapper>();
        services.AddSingleton<IChatConnector, DiscordConnector>();

        services.AddHealthChecks()
            .AddCheck<DiscordHealthCheck>(
                "discord",
                failureStatus: HealthStatus.Degraded,
                tags: ["streaming", "discord"]);
        
    }
}
