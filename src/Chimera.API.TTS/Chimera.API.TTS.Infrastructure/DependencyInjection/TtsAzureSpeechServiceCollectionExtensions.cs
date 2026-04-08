using Chimera.API.Core.DependencyInjection;
using Chimera.API.TTS.Infrastructure.AzureSpeech;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Chimera.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the Azure Cognitive Services Speech HTTP client and <see cref="AzureSpeechTtsProvider"/>.
/// </summary>
public static class TtsAzureSpeechServiceCollectionExtensions
{
    public static IServiceCollection AddChimeraTtsAzureSpeechClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<AzureSpeechTtsClientSettings>(
            configuration.GetSection(AzureSpeechTtsClientSettings.SectionName));

        services.AddHttpClient(AzureSpeechTtsClient.HttpClientName)
            .ConfigureHttpClient((sp, client) =>
            {
                var settings = sp.GetRequiredService<IOptions<AzureSpeechTtsClientSettings>>().Value;
                client.Timeout = settings.Timeout;
            })
            .AddChimeraHttpResilience();

        services.AddSingleton<AzureSpeechTtsClient>();
        services.AddSingleton<AzureSpeechTtsProvider>();

        return services;
    }
}
