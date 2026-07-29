using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Application.Health;
using Inktide.API.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Connector.InktideChat;

/// <summary>
/// Registers the InktideChat connector as both <see cref="IChatConnector"/> and
/// <see cref="IInktideChatInbox"/> - single singleton instance serves both roles.
/// </summary>
public sealed class InktideChatStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddSingleton<IInktideChatMessageMapper, InktideChatMessageMapper>();
        services.AddSingleton<InktideChatConnector>();
        services.AddSingleton<IChatConnector>(sp => sp.GetRequiredService<InktideChatConnector>());
        services.AddSingleton<IInktideChatInbox>(sp => sp.GetRequiredService<InktideChatConnector>());

        services.AddHealthChecks()
            .Add(new HealthCheckRegistration(
                "inktide-chat",
                sp => new ConnectorHealthCheck(
                    sp.GetRequiredService<IEnumerable<IChatConnector>>(),
                    InktideChatConnector.PlatformIdValue,
                    "InktideChat inbox is accepting messages",
                    "InktideChat connector is not running"),
                HealthStatus.Degraded,
                ["streaming", "inktide-chat"]));
    }
}
