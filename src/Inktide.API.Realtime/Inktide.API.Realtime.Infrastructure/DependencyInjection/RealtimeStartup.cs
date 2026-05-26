using Inktide.API.Core;
using Inktide.API.Realtime.Infrastructure.Configuration;
using Inktide.API.Realtime.Infrastructure.Constants;
using Inktide.API.Realtime.Infrastructure.Hubs;
using Inktide.API.Realtime.Infrastructure.Messaging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Inktide.API.Realtime.Infrastructure.DependencyInjection;

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
            .BindConfiguration(RealtimeStreamSettings.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<RealtimeTextStreamSettings>()
            .BindConfiguration(RealtimeTextStreamSettings.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // audio WAV payloads can be ~200 KB base64-encoded
        services.AddSignalR(options =>
        {
            options.MaximumReceiveMessageSize = RealtimeConstants.MaxSignalRMessageBytes;
        });

        services.AddHostedService<BrowserAudioPublisher>();
        services.AddHostedService<BrowserTextPublisher>();
    }
}
