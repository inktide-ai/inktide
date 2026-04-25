using Inktide.API.Core.DependencyInjection;
using Inktide.API.TTS.Infrastructure.FishAudio;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the Fish Audio TTS HTTP client and <see cref="FishAudioTtsProvider"/>.
/// </summary>
public static class TtsFishAudioServiceCollectionExtensions
{
    public static IServiceCollection AddInktideTtsFishAudioClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<FishAudioTtsClientSettings>(
            configuration.GetSection(FishAudioTtsClientSettings.SectionName));

        services.AddHttpClient(FishAudioTtsClient.HttpClientName)
            .ConfigureHttpClient((sp, client) =>
            {
                var settings = sp.GetRequiredService<IOptions<FishAudioTtsClientSettings>>().Value;
                client.Timeout = settings.Timeout;
            })
            .AddInktideHttpResilience();

        services.AddSingleton<FishAudioTtsClient>();
        services.AddSingleton<FishAudioTtsProvider>();

        return services;
    }
}
