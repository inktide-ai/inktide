using Inktide.API.Core;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Settings;
using Inktide.API.ScreenAwareness.Infrastructure.Hashing;
using Inktide.API.ScreenAwareness.Infrastructure.Ingestion;
using Inktide.API.ScreenAwareness.Infrastructure.Redis;
using Inktide.API.ScreenAwareness.Infrastructure.Settings.Validators;
using Inktide.API.ScreenAwareness.Infrastructure.Telemetry;
using Inktide.API.ScreenAwareness.Infrastructure.Vision;
using Inktide.API.ScreenAwareness.Infrastructure.Workers;
using Inktide.API.Synapse.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Inktide.API.ScreenAwareness.Infrastructure;

public sealed class ScreenAwarenessInfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        // Settings
        services.AddOptions<ScreenAwarenessSettings>()
            .BindConfiguration(ScreenAwarenessSettings.SectionName)
            .ValidateOnStart();
        services.AddSingleton<IValidateOptions<ScreenAwarenessSettings>, ScreenAwarenessSettingsValidator>();

        services.AddOptions<ScreenFrameStreamSettings>()
            .BindConfiguration(ScreenFrameStreamSettings.SectionName)
            .ValidateOnStart();
        services.AddSingleton<IValidateOptions<ScreenFrameStreamSettings>, ScreenFrameStreamSettingsValidator>();

        // Vision providers - both registered; active one selected by VisionProvider setting
        services.AddHttpClient<AnthropicVisionClient>();
        services.AddHttpClient<OllamaVisionClient>();
        services.AddSingleton<IVisionModelClient>(sp =>
        {
            var settings = sp.GetRequiredService<IOptions<ScreenAwarenessSettings>>().Value;
            return settings.VisionProvider.Equals("anthropic", StringComparison.OrdinalIgnoreCase)
                ? sp.GetRequiredService<AnthropicVisionClient>()
                : sp.GetRequiredService<OllamaVisionClient>();
        });

        services.AddSingleton<IScreenEventExtractor, JsonScreenEventExtractor>();
        services.AddSingleton<IVisionUsageRecorder, LogVisionUsageRecorder>();
        services.AddSingleton<IScreenContextRepository, RedisScreenContextRepository>();
        services.AddSingleton<IVisionBudgetService, RedisVisionBudgetService>();
        services.AddSingleton<IPhashService, PHashService>();
        services.AddSingleton<IFrameHashStore, RedisFrameHashStore>();
        services.AddSingleton<ScreenAwarenessMetrics>();

        services.AddScoped<IFrameIngestionService, FrameIngestionService>();

        services.AddHostedService<ScreenVisionWorker>();
    }
}
