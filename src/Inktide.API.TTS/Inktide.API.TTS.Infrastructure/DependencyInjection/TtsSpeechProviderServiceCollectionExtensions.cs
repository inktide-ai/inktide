using Inktide.API.TTS.Application.Configuration;
using Inktide.API.TTS.Domain.Speech;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

public static class TtsSpeechProviderServiceCollectionExtensions
{
    public static IServiceCollection AddInktideSpeechProviders(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<TtsProviderOptions>(configuration.GetSection(TtsProviderOptions.SectionName));
        services.AddSingleton<ISpeechProviderRegistry, SpeechProviderRegistry>();

        return services;
    }

}
