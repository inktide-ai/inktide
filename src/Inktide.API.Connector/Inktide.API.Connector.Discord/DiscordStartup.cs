

using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Discord.Health;
using Inktide.API.Connector.Discord.Settings;
using Inktide.API.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Connector.Discord;

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
