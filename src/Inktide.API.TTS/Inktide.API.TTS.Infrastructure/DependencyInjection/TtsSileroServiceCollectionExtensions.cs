using Inktide.API.TTS.Infrastructure.Kokoro;
using Inktide.API.TTS.Infrastructure.Silero;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers <see cref="SileroTtsProvider"/> when <c>TtsProviders:Silero:Endpoint</c> is configured.
/// Returns whether it did, so the caller adds the provider to the registry only then.
/// </summary>
public static class TtsSileroServiceCollectionExtensions
{
    public static bool AddInktideTtsSileroClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var settings = configuration.GetSection(SileroTtsSettings.SectionName).Get<SileroTtsSettings>();
        if (settings?.Endpoint is null)
            return false;

        // Same HTTP API as Kokoro-FastAPI: a second KokoroTtsClient aimed at the Silero service.
        services.AddSingleton(sp => new SileroTtsProvider(new KokoroTtsClient(
            sp.GetRequiredService<IHttpClientFactory>(),
            Options.Create(new KokoroTtsClientSettings { Endpoint = settings.Endpoint, Timeout = settings.Timeout }),
            sp.GetService<ILogger<KokoroTtsClient>>())));

        return true;
    }
}
