using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Application.Health;
using Inktide.API.Connector.Application.OAuth;
using Inktide.API.Connector.Discord.Gateway;
using Inktide.API.Connector.Discord.OAuth;
using Inktide.API.Connector.Discord.Settings;
using Inktide.API.Core;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Connector.Discord;

/// <summary>
/// Registers Discord connector (IChatConnector) — Gateway WebSocket via Discord.Net.
/// Also registers Discord OAuth2 services and the REST controller.
/// </summary>
public sealed class DiscordStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<DiscordSettings>()
            .BindConfiguration(nameof(DiscordSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton<IGuildSoulRegistry, GuildSoulRegistry>();
        services.AddHostedService<GuildRegistryLoader>();

        services.AddSingleton<IDiscordMessageMapper, DiscordMessageMapper>();
        services.AddSingleton<IDiscordMessageHandler, DiscordMessageHandler>();
        services.AddSingleton<IChatConnector, DiscordConnector>();

        services.AddOptions<OAuthStateSettings>()
            .BindConfiguration("AuthSettings")
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.TryAddSingleton<IOAuthStateService, OAuthStateService>();
        services.AddSingleton<IDiscordTokenProtector, DiscordTokenProtector>();
        services.AddSingleton<IDiscordOAuthService, DiscordOAuthService>();
        services.AddHttpClient(DiscordOAuthService.HttpClientName);
        services.AddHttpClient("discord-validate")
            .ConfigureHttpClient(c => c.Timeout = TimeSpan.FromSeconds(5));

        services.AddControllers()
            .PartManager.ApplicationParts.Add(
                new AssemblyPart(typeof(DiscordStartup).Assembly));

        services.AddHealthChecks()
            .Add(new HealthCheckRegistration(
                "discord",
                sp => new ConnectorHealthCheck(
                    sp.GetRequiredService<IEnumerable<IChatConnector>>(),
                    DiscordConnector.PlatformIdValue,
                    "Discord Gateway WebSocket connected",
                    "Discord Gateway WebSocket disconnected"),
                HealthStatus.Degraded,
                ["streaming", "discord"]));
    }
}
