using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Application.Health;
using Inktide.API.Connector.Application.OAuth;
using Inktide.API.Connector.Discord.Gateway;
using Inktide.API.Connector.Discord.OAuth;
using Inktide.API.Connector.Discord.Settings;
using Inktide.API.Core;
using Microsoft.AspNetCore.DataProtection;
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

        // ── Guild routing registry ────────────────────────────────────────────
        services.AddSingleton<IGuildSoulRegistry, GuildSoulRegistry>();
        services.AddHostedService<GuildRegistryLoader>();

        // ── Connector ─────────────────────────────────────────────────────────
        services.AddSingleton<IDiscordMessageMapper, DiscordMessageMapper>();
        services.AddSingleton<IDiscordMessageHandler, DiscordMessageHandler>();
        services.AddSingleton<IChatConnector, DiscordConnector>();

        // ── OAuth2 services ───────────────────────────────────────────────────
        services.AddOptions<OAuthStateSettings>()
            .BindConfiguration("AuthSettings")
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.TryAddSingleton<IOAuthStateService, OAuthStateService>();
        services.AddKeyedSingleton<ITokenProtector>(TokenProtectorKeys.Discord, (sp, _) =>
            new DataProtectionTokenProtector(
                sp.GetRequiredService<IDataProtectionProvider>(),
                "Discord.OAuth.Tokens"));
        services.AddHttpClient<IDiscordOAuthService, DiscordOAuthService>();
        services.AddHttpClient("discord-validate")
            .ConfigureHttpClient(c => c.Timeout = TimeSpan.FromSeconds(5));

        // ── REST controller (in this assembly) ───────────────────────────────
        services.AddControllers()
            .PartManager.ApplicationParts.Add(
                new AssemblyPart(typeof(DiscordStartup).Assembly));

        // ── Health check ──────────────────────────────────────────────────────
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
