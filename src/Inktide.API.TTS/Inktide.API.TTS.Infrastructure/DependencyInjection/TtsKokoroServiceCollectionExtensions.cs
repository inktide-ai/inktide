using Inktide.API.Core.DependencyInjection;
using Inktide.API.TTS.Infrastructure.Kokoro;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers Kokoro TTS HTTP client and <see cref="KokoroTtsProvider"/>.
/// </summary>
public static class TtsKokoroServiceCollectionExtensions
{

    public static IServiceCollection AddInktideTtsKokoroClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<KokoroTtsClientSettings>(
            configuration.GetSection(KokoroTtsClientSettings.SectionName));

        services.AddHttpClient(KokoroTtsClient.HttpClientName, (sp, client) =>
            {
                var settings = sp.GetRequiredService<IOptions<KokoroTtsClientSettings>>().Value;
                client.Timeout = settings.Timeout;
            })
            .AddInktideHttpResilience();

        services.AddSingleton<KokoroTtsClient>();
        services.AddSingleton<KokoroTtsProvider>();

        return services;
    }

}
