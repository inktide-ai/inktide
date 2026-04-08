using Chimera.API.TTS.Infrastructure.OpenAi;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Chimera.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the OpenAI-compatible TTS provider.
/// </summary>
public static class TtsOpenAiCompatibleServiceCollectionExtensions
{
    public static IServiceCollection AddChimeraTtsOpenAiCompatibleClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<OpenAiCompatibleTtsSettings>(
            configuration.GetSection(OpenAiCompatibleTtsSettings.SectionName));

        services.AddSingleton<OpenAiCompatibleTtsProvider>();

        return services;
    }
}
