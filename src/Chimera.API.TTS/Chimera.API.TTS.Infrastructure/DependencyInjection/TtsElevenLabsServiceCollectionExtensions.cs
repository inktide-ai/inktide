using Chimera.API.Core.DependencyInjection;
using Chimera.API.TTS.Infrastructure.ElevenLabs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Chimera.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the ElevenLabs TTS HTTP client and <see cref="ElevenLabsTtsProvider"/>.
/// </summary>
public static class TtsElevenLabsServiceCollectionExtensions
{
    public static IServiceCollection AddChimeraTtsElevenLabsClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<ElevenLabsTtsClientSettings>(
            configuration.GetSection(ElevenLabsTtsClientSettings.SectionName));

        services.AddHttpClient(ElevenLabsTtsClient.HttpClientName)
            .ConfigureHttpClient((sp, client) =>
            {
                var settings = sp.GetRequiredService<IOptions<ElevenLabsTtsClientSettings>>().Value;
                client.Timeout = settings.Timeout;
            })
            .AddChimeraHttpResilience();

        services.AddSingleton<ElevenLabsTtsClient>();
        services.AddSingleton<ElevenLabsTtsProvider>();

        return services;
    }
}
