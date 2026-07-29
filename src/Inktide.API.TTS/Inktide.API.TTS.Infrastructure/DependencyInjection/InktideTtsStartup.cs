using Inktide.API.Core;
using Inktide.API.TTS.Application.Configuration;
using Inktide.API.TTS.Infrastructure.LipSync;
using Inktide.API.TTS.Infrastructure.Messaging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.TTS.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the TTS bounded context into MS DI (discovered via <see cref="IStartup"/>).
/// Owns both the synthesis stack and the Redis stream consumer that drives it.
/// </summary>
public sealed class InktideTtsStartup : IStartup
{

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(ctx);
        ArgumentNullException.ThrowIfNull(services);

        services.AddInktideTts(ctx.Configuration);
        services.AddSingleton<IRhubarbService, RhubarbService>();

        // Stream consumer: LLM responses -> TTS synthesis -> audio output stream.
        // This lives here (not in Synapse) because TTS owns the synthesis pipeline.
        services.AddOptions<LlmResponseStreamSettings>()
            .BindConfiguration(LlmResponseStreamSettings.SectionName);

        services.AddOptions<TtsOutputStreamSettings>()
            .BindConfiguration(TtsOutputStreamSettings.SectionName);

        services.AddHostedService<LlmResponseStreamConsumer>();
    }

}
