using Inktide.API.TTS.Application.Abstractions;
using Inktide.API.TTS.Application.Synthesis;
using Inktide.API.TTS.Domain.Speech;
using Inktide.API.TTS.Infrastructure.AzureSpeech;
using Inktide.API.TTS.Infrastructure.Cartesia;
using Inktide.API.TTS.Infrastructure.Decorators;
using Inktide.API.TTS.Infrastructure.ElevenLabs;
using Inktide.API.TTS.Infrastructure.FishAudio;
using Inktide.API.TTS.Infrastructure.GoogleCloud;
using Inktide.API.TTS.Infrastructure.Kokoro;
using Inktide.API.TTS.Infrastructure.OpenAi;
using Inktide.API.TTS.Infrastructure.Telemetry;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

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

        services.AddSingleton<SpeechProviderDecoratorApplicator>();
        services.AddSingleton<ISpeechProvider>(sp => sp.GetRequiredService<SpeechProviderDecoratorApplicator>().Apply(sp.GetRequiredService<KokoroTtsProvider>()));
        services.AddSingleton<ISpeechProvider>(sp => sp.GetRequiredService<SpeechProviderDecoratorApplicator>().Apply(sp.GetRequiredService<ElevenLabsTtsProvider>()));
        services.AddSingleton<ISpeechProvider>(sp => sp.GetRequiredService<SpeechProviderDecoratorApplicator>().Apply(sp.GetRequiredService<FishAudioTtsProvider>()));
        services.AddSingleton<ISpeechProvider>(sp => sp.GetRequiredService<SpeechProviderDecoratorApplicator>().Apply(sp.GetRequiredService<OpenAiTtsProvider>()));
        services.AddSingleton<ISpeechProvider>(sp => sp.GetRequiredService<SpeechProviderDecoratorApplicator>().Apply(sp.GetRequiredService<OpenAiCompatibleTtsProvider>()));
        services.AddSingleton<ISpeechProvider>(sp => sp.GetRequiredService<SpeechProviderDecoratorApplicator>().Apply(sp.GetRequiredService<AzureSpeechTtsProvider>()));
        services.AddSingleton<ISpeechProvider>(sp => sp.GetRequiredService<SpeechProviderDecoratorApplicator>().Apply(sp.GetRequiredService<GoogleCloudTtsProvider>()));
        services.AddSingleton<ISpeechProvider>(sp => sp.GetRequiredService<SpeechProviderDecoratorApplicator>().Apply(sp.GetRequiredService<CartesiaTtsProvider>()));

        services.AddInktideSpeechProviders(configuration);

        return services;
    }

}
