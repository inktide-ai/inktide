using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Chimera.API.TTS.Application.DependencyInjection;

/// <summary>
/// Registers TTS stack into MS DI (discovered via <see cref="Chimera.API.Core.IStartup"/>).
/// </summary>
public sealed class ChimeraTtsStartup : Chimera.API.Core.IStartup
{
    #region Public Methods

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(ctx);
        ArgumentNullException.ThrowIfNull(services);

        services.AddChimeraTts(ctx.Configuration);
    }

    #endregion
}
