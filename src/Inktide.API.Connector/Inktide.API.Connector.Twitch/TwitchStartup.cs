using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Twitch.Gateway;
using Inktide.API.Connector.Twitch.OAuth;
using Inktide.API.Connector.Twitch.Settings;
using Inktide.API.Core;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Connector.Twitch;

/// <summary>
/// Registers the Twitch connector: IRC client (IChatConnector), OAuth2 services,
/// channel registry, and the REST controller.
/// </summary>
public sealed class TwitchStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<TwitchSettings>()
            .BindConfiguration(nameof(TwitchSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // ── Channel routing registry ──────────────────────────────────────────
        services.AddSingleton<ITwitchChannelRegistry, TwitchChannelRegistry>();

        // ── IRC Connector ─────────────────────────────────────────────────────
        services.AddSingleton<TwitchMessageHandler>();
        services.AddSingleton<TwitchConnector>();
        services.AddSingleton<IChatConnector>(sp => sp.GetRequiredService<TwitchConnector>());
        services.AddSingleton<ITwitchConnector>(sp => sp.GetRequiredService<TwitchConnector>());

        // ── Registry loader: bulk-JOINs channels from DB at startup ──────────
        services.AddHostedService<TwitchChannelRegistryLoader>();

        // ── OAuth2 services ───────────────────────────────────────────────────
        services.AddSingleton<TwitchOAuthStateService>();
        services.AddHttpClient<ITwitchOAuthService, TwitchOAuthService>();

        // ── REST controller (in this assembly) ───────────────────────────────
        services.AddControllers()
            .PartManager.ApplicationParts.Add(
                new AssemblyPart(typeof(TwitchStartup).Assembly));
    }
}
