using Chimera.API.Connector.Application.Contracts;
using Chimera.API.Connector.ChimeraChat.Health;
using Chimera.API.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Chimera.API.Connector.ChimeraChat;

/// <summary>
/// Registers the ChimeraChat connector as both <see cref="IChatConnector"/> and
/// <see cref="IChimeraChatInbox"/> — single singleton instance serves both roles.
/// </summary>
public sealed class ChimeraChatStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddSingleton<ChimeraChatConnector>();
        services.AddSingleton<IChatConnector>(sp => sp.GetRequiredService<ChimeraChatConnector>());
        services.AddSingleton<IChimeraChatInbox>(sp => sp.GetRequiredService<ChimeraChatConnector>());

        services.AddHealthChecks()
            .AddCheck<ChimeraChatHealthCheck>(
                "chimera-chat",
                failureStatus: HealthStatus.Degraded,
                tags: ["streaming", "chimera-chat"]);
    }
}
