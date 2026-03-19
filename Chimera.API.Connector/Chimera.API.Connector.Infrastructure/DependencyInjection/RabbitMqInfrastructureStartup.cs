using Chimera.API.Connector.Application.Contracts;
using Chimera.API.Connector.Infrastructure.Messaging;
using Chimera.API.Connector.Infrastructure.Settings;
using Chimera.API.Connector.Infrastructure.Settings.Validators;
using Chimera.API.Connector.Infrastructure.Hosting;
using Chimera.API.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Chimera.API.Connector.Infrastructure.DependencyInjection;

/// <summary>Infrastructure startup — registers DbContext, messaging pipeline, and health checks.</summary>
public sealed class RabbitMqInfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
    
        services.AddOptions<RabbitMqSettings>()
            .BindConfiguration(nameof(RabbitMqSettings))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<RabbitMqSettings>, RabbitMqSettingsValidator>();

        var channel = new ChatMessageChannel();
        services.AddSingleton(channel);
        services.AddSingleton<IChatMessageQueue>(channel);
        services.AddSingleton<IRabbitMqChannelProvider, RabbitMqConnectionProvider>();
        services.AddSingleton<IStreamMessageHandler, RabbitMqMessageHandler>();
        services.AddHostedService<RabbitMqPublisherWorker>();
        services.AddHostedService<ChatConnectorHostedService>();

        services.AddControllers();

        services
            .AddHealthChecks()
            .AddCheck<RabbitMqHealthCheck>(
                name: "rabbitmq",
                failureStatus: HealthStatus.Unhealthy);
        
    }

}
