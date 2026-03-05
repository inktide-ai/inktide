using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using TwitchLib.EventSub.Websockets.Extensions;
using Chimera.ApiGateway.Application.Contracts.Streaming;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Twitch.Auth;
using Chimera.ApiGateway.Twitch.Health;
using Chimera.ApiGateway.Twitch.Settings;

namespace Chimera.ApiGateway.Twitch;

/// <summary>
/// Registers Twitch connector (IChatConnector) — WebSocket via EventSub.
/// </summary>
public sealed class TwitchStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<TwitchSettings>()
            .BindConfiguration(nameof(TwitchSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddTwitchLibEventSubWebsockets();
        services.AddSingleton<ITwitchTokenProvider, TwitchClientCredentialsTokenProvider>();
        services.AddSingleton<TwitchMessageMapper>();
        services.AddSingleton<IChatConnector, TwitchConnector>();

        services.AddHealthChecks()
            .AddCheck<TwitchHealthCheck>(
                "twitch",
                failureStatus: HealthStatus.Degraded,
                tags: ["streaming", "twitch"]);
    }
}
