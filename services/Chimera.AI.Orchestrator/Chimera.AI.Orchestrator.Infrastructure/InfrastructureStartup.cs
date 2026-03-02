using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Chimera.AI.Orchestrator.Core;
using Chimera.AI.Orchestrator.Infrastructure.Messaging;
using Chimera.AI.Orchestrator.Infrastructure.Settings;

namespace Chimera.AI.Orchestrator.Infrastructure;

/// <summary>
/// Registers infrastructure services (RabbitMQ consumer + publisher) into MS DI.
/// Discovered automatically by the module system via <see cref="IStartup"/>.
/// </summary>
public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddOptions<RabbitMqSettings>()
            .BindConfiguration(nameof(RabbitMqSettings))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        
        services.AddHostedService<ChatMessageConsumer>();
    }
}
