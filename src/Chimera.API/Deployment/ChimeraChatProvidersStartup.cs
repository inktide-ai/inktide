using Chimera.API.Core.DependencyInjection;
using Chimera.API.Synapse.Infrastructure.Providers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Chimera.API.Deployment;

/// <summary>
/// Registers enterprise-style chat provider stack (registry, decorators, options) into MS DI for DryIoc host.
/// </summary>
public sealed class ChimeraChatProvidersStartup : Chimera.API.Core.IStartup
{
    #region Public Methods

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(ctx);
        ArgumentNullException.ThrowIfNull(services);

        services.AddChimeraChatProviders(ctx.Configuration, (sp, list) =>
        {
            list.Add(sp.GetRequiredService<OllamaChatProvider>());
        });
    }

    #endregion
}
