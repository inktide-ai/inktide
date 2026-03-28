using Chimera.API.TTS.Application.Abstractions;
using Chimera.API.TTS.Application.Synthesis;
using Chimera.API.TTS.Infrastructure.Kokoro;
using Chimera.API.TTS.Infrastructure.Telemetry;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Chimera.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the full TTS stack (composition root for this bounded context).
/// </summary>
public static class ChimeraTtsServiceCollectionExtensions
{
    #region Public Methods

    public static IServiceCollection AddChimeraTts(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddHttpContextAccessor();
        services.AddSingleton<IApiKeyResolver, TtsApiKeyResolver>();
        services.AddSingleton<ITtsUsageRecorder, LogTtsUsageRecorder>();
        services.AddSingleton<ITtsSynthesisService, TtsSynthesisService>();

        services.AddChimeraTtsKokoroClients(configuration);
        services.AddChimeraSpeechProviders(configuration, (sp, list) =>
        {
            list.Add(sp.GetRequiredService<KokoroTtsProvider>());
        });

        return services;
    }

    #endregion
}
