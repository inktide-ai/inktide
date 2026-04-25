using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.InktideChat.Health;
using Inktide.API.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Connector.InktideChat;

/// <summary>
/// Registers the InktideChat connector as both <see cref="IChatConnector"/> and
/// <see cref="IInktideChatInbox"/> — single singleton instance serves both roles.
/// </summary>
public sealed class InktideChatStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddSingleton<InktideChatConnector>();
        services.AddSingleton<IChatConnector>(sp => sp.GetRequiredService<InktideChatConnector>());
        services.AddSingleton<IInktideChatInbox>(sp => sp.GetRequiredService<InktideChatConnector>());

        services.AddHealthChecks()
            .AddCheck<InktideChatHealthCheck>(
                "inktide-chat",
                failureStatus: HealthStatus.Degraded,
                tags: ["streaming", "inktide-chat"]);
    }
}
