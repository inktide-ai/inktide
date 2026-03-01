using DryIoc;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;
using Chimera.ApiGateway.Core;
using Chimera.ApiGateway.Core.Settings;

namespace Chimera.ApiGateway.Deployment;

/// <summary>
/// Registers Redis (IConnectionMultiplexer) in DI using <see cref="RedisSettings"/> and <see cref="RedisSettings.ToConnectionString"/>.
/// </summary>
public sealed class RedisServiceRegistrator : IServiceRegistrator
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        var redisSettings = new RedisSettings();
        configuration.GetSection(nameof(RedisSettings)).Bind(redisSettings);
        
        registrator.RegisterInstance(redisSettings);
        registrator.RegisterDelegate<IConnectionMultiplexer>(
            _ => ConnectionMultiplexer.Connect(redisSettings.ToConnectionString()),
            Reuse.Singleton);
    }
}
