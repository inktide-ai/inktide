using Chimera.API.TTS.Core;
using Chimera.API.TTS.Core.DependencyInjection;
using Chimera.API.TTS.Infrastructure.DependencyInjection;
using Chimera.API.TTS.Infrastructure.Kokoro;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Chimera.API.TTS.Application.DependencyInjection;

/// <summary>
/// Composes TTS stack: Kokoro HTTP client + speech provider registry.
/// </summary>
public static class ChimeraTtsApplicationServiceCollectionExtensions
{
    #region Public Methods

    public static IServiceCollection AddChimeraTts(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        
        services.AddChimeraTtsKokoroClients(configuration);
        services.AddChimeraSpeechProviders(configuration, (sp, list) =>
        {
            list.Add(sp.GetRequiredService<KokoroTtsProvider>());
        });

        return services;
    }

    #endregion
}
