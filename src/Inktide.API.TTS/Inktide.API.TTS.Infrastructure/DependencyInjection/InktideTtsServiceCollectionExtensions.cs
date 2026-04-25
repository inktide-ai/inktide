using Inktide.API.TTS.Application.Abstractions;
using Inktide.API.TTS.Application.Synthesis;
using Inktide.API.TTS.Infrastructure.AzureSpeech;
using Inktide.API.TTS.Infrastructure.Cartesia;
using Inktide.API.TTS.Infrastructure.GoogleCloud;
using Inktide.API.TTS.Infrastructure.ElevenLabs;
using Inktide.API.TTS.Infrastructure.FishAudio;
using Inktide.API.TTS.Infrastructure.Kokoro;
using Inktide.API.TTS.Infrastructure.OpenAi;
using Inktide.API.TTS.Infrastructure.Telemetry;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the full TTS stack (composition root for this bounded context).
/// </summary>
public static class InktideTtsServiceCollectionExtensions
{

    public static IServiceCollection AddInktideTts(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddHttpContextAccessor();
        services.AddSingleton<IApiKeyResolver, TtsApiKeyResolver>();
        services.AddSingleton<ITtsUsageRecorder, LogTtsUsageRecorder>();
        services.AddSingleton<ITtsSynthesisService, TtsSynthesisService>();

        services.AddInktideTtsKokoroClients(configuration);
        services.AddInktideTtsElevenLabsClients(configuration);
        services.AddInktideTtsFishAudioClients(configuration);
        services.AddInktideTtsOpenAiClients(configuration);
        services.AddInktideTtsOpenAiCompatibleClients(configuration);
        services.AddInktideTtsAzureSpeechClients(configuration);
        services.AddInktideTtsGoogleCloudClients(configuration);
        services.AddInktideTtsCartesiaClients(configuration);
        services.AddInktideSpeechProviders(configuration, (sp, list) =>
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

}
