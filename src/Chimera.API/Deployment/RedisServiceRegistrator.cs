using Chimera.API.Core;
using Chimera.API.Core.Settings;
using DryIoc;
using StackExchange.Redis;

namespace Chimera.API.Deployment;


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