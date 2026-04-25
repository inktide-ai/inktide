using Inktide.API.Core.DependencyInjection;
using Inktide.API.TTS.Infrastructure.Cartesia;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the Cartesia TTS HTTP client and <see cref="CartesiaTtsProvider"/>.
/// </summary>
public static class TtsCartesiaServiceCollectionExtensions
{
    public static IServiceCollection AddInktideTtsCartesiaClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<CartesiaTtsClientSettings>(
            configuration.GetSection(CartesiaTtsClientSettings.SectionName));

        services.AddHttpClient(CartesiaTtsClient.HttpClientName)
            .ConfigureHttpClient((sp, client) =>
            {
                var settings = sp.GetRequiredService<IOptions<CartesiaTtsClientSettings>>().Value;
                client.BaseAddress = settings.Endpoint;
                client.Timeout     = settings.Timeout;
            })
            .AddInktideHttpResilience();

        services.AddSingleton<CartesiaTtsClient>();
        services.AddSingleton<CartesiaTtsProvider>();

        return services;
    }
}
