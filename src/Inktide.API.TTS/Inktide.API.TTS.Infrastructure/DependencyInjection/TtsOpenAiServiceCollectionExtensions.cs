using Inktide.API.TTS.Infrastructure.OpenAi;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the official OpenAI TTS provider.
/// </summary>
public static class TtsOpenAiServiceCollectionExtensions
{
    public static IServiceCollection AddInktideTtsOpenAiClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<OpenAiTtsSettings>(
            configuration.GetSection(OpenAiTtsSettings.SectionName));

        services.AddSingleton<OpenAiTtsClient>();
        services.AddSingleton<OpenAiTtsProvider>();

        return services;
    }
}
