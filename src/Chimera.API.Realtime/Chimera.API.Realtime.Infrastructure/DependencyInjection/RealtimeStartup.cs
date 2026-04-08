using Chimera.API.Core;
using Chimera.API.Realtime.Infrastructure.Configuration;
using Chimera.API.Realtime.Infrastructure.Hubs;
using Chimera.API.Realtime.Infrastructure.Messaging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Chimera.API.Realtime.Infrastructure.DependencyInjection;

/// <summary>
/// Registers the Realtime bounded context: SignalR hub + Redis stream consumer
/// that bridges <c>synapse.tts.ready</c> to connected browser clients.
/// Discovered automatically by the module system via <see cref="IStartup"/>.
/// </summary>
public sealed class RealtimeStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<RealtimeStreamSettings>()
            .BindConfiguration(RealtimeStreamSettings.SectionName);

        services.AddOptions<RealtimeTextStreamSettings>()
            .BindConfiguration(RealtimeTextStreamSettings.SectionName);

        // 5 MB max message size — audio WAV payloads can be ~200 KB base64-encoded.
        services.AddSignalR(options =>
        {
            options.MaximumReceiveMessageSize = 5 * 1024 * 1024;
        });

        services.AddHostedService<BrowserAudioPublisher>();
        services.AddHostedService<BrowserTextPublisher>();
    }
}
