using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Connector.Infrastructure.Hosting;
using Inktide.API.Connector.Infrastructure.Messaging;
using Inktide.API.Core;
using Inktide.API.Core.Settings;
using Inktide.API.Core.Settings.Validators;
using HealthChecks.Redis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Inktide.API.Connector.Infrastructure.DependencyInjection;

/// <summary>Infrastructure startup — messaging pipeline (Redis Streams ingest) and health checks.</summary>
public sealed class SynapseIngestConnectorStartup : IStartup
{

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<RedisSettings>()
            .BindConfiguration(nameof(RedisSettings));

        services.AddOptions<SynapseIngestStreamSettings>()
            .BindConfiguration(nameof(SynapseIngestStreamSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<SynapseIngestStreamSettings>, SynapseIngestStreamSettingsValidator>();

        var channel = new ChatMessageChannel();
        services.AddSingleton(channel);
        services.AddSingleton<IChatMessageQueue>(channel);
        services.AddSingleton<IStreamMessageHandler, SynapseIngestMessageHandler>();
        services.AddHostedService<RedisStreamPublisherWorker>();
        services.AddHostedService<ChatConnectorHostedService>();

        services.AddControllers();

        var redisSettings = new RedisSettings();
        ctx.Configuration.GetSection(nameof(RedisSettings)).Bind(redisSettings);

        services
            .AddHealthChecks()
            .AddRedis(redisSettings.ToConnectionString(), name: "redis", tags: ["ready", "synapse-ingest", "cache"]);
    }

}
