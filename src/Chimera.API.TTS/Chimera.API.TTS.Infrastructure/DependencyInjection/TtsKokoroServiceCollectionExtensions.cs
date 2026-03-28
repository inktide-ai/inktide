using Chimera.API.Core.DependencyInjection;
using Chimera.API.TTS.Infrastructure.Kokoro;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Chimera.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers Kokoro TTS HTTP client and <see cref="KokoroTtsProvider"/>.
/// </summary>
public static class TtsKokoroServiceCollectionExtensions
{
    #region Public Methods

    public static IServiceCollection AddChimeraTtsKokoroClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<KokoroTtsClientSettings>(
            configuration.GetSection(KokoroTtsClientSettings.SectionName));

        services.AddHttpClient(KokoroTtsClient.HttpClientName, client =>
            {
                client.Timeout = TimeSpan.FromMinutes(5);
            })
            .AddChimeraHttpResilience();

        services.AddSingleton<KokoroTtsClient>();
        services.AddSingleton<KokoroTtsProvider>();

        return services;
    }

    #endregion
}
