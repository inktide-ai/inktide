using Chimera.API.TTS.Infrastructure.GoogleCloud;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Chimera.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the Google Cloud TTS gRPC client and <see cref="GoogleCloudTtsProvider"/>.
/// </summary>
public static class TtsGoogleCloudServiceCollectionExtensions
{
    public static IServiceCollection AddChimeraTtsGoogleCloudClients(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<GoogleCloudTtsClientSettings>(
            configuration.GetSection(GoogleCloudTtsClientSettings.SectionName));

        // No IHttpClientFactory — the SDK manages its own gRPC channels internally.
        services.AddSingleton<GoogleCloudTtsClient>();
        services.AddSingleton<GoogleCloudTtsProvider>();

        return services;
    }
}
