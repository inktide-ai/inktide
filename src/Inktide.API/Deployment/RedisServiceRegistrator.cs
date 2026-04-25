using Inktide.API.Core;
using Inktide.API.Core.Settings;
using DryIoc;
using StackExchange.Redis;

namespace Inktide.API.Deployment;


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