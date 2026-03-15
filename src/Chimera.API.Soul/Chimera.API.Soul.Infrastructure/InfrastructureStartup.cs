using Chimera.API.Core;
using Chimera.API.Soul.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Chimera.API.Soul.Infrastructure;

/// <summary>
/// Registers infrastructure services (RabbitMQ consumer + publisher) into MS DI.
/// Discovered automatically by the module system via <see cref="IStartup"/>.
/// </summary>
public sealed class InfrastructureStartup : IStartup
{
    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
    {
        services.AddSingleton<IProsto, Prosto>();
        
    }
}
