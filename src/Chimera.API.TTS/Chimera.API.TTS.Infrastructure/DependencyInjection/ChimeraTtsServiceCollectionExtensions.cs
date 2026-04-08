using Chimera.API.TTS.Application.Abstractions;
using Chimera.API.TTS.Application.Synthesis;
using Chimera.API.TTS.Infrastructure.AzureSpeech;
using Chimera.API.TTS.Infrastructure.Cartesia;
using Chimera.API.TTS.Infrastructure.GoogleCloud;
using Chimera.API.TTS.Infrastructure.ElevenLabs;
using Chimera.API.TTS.Infrastructure.FishAudio;
using Chimera.API.TTS.Infrastructure.Kokoro;
using Chimera.API.TTS.Infrastructure.OpenAi;
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
        services.AddChimeraTtsElevenLabsClients(configuration);
        services.AddChimeraTtsFishAudioClients(configuration);
        services.AddChimeraTtsOpenAiClients(configuration);
        services.AddChimeraTtsOpenAiCompatibleClients(configuration);
        services.AddChimeraTtsAzureSpeechClients(configuration);
        services.AddChimeraTtsGoogleCloudClients(configuration);
        services.AddChimeraTtsCartesiaClients(configuration);
        services.AddChimeraSpeechProviders(configuration, (sp, list) =>
        {
            list.Add(sp.GetRequiredService<KokoroTtsProvider>());
            list.Add(sp.GetRequiredService<ElevenLabsTtsProvider>());
            list.Add(sp.GetRequiredService<FishAudioTtsProvider>());
            list.Add(sp.GetRequiredService<OpenAiTtsProvider>());
            list.Add(sp.GetRequiredService<OpenAiCompatibleTtsProvider>());
            list.Add(sp.GetRequiredService<AzureSpeechTtsProvider>());
            list.Add(sp.GetRequiredService<GoogleCloudTtsProvider>());
            list.Add(sp.GetRequiredService<CartesiaTtsProvider>());
        });

        return services;
    }

    #endregion
}
