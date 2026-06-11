using Inktide.API.Core;
using Inktide.API.Core.Settings;
using DryIoc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using StackExchange.Redis;

namespace Inktide.API.Deployment;


/// <summary>
/// Registers Redis (IConnectionMultiplexer) in DI using <see cref="RedisSettings"/> and <see cref="RedisSettings.ToConnectionString"/>.
/// Also registers <see cref="RedisLifetimeService"/> to ensure the multiplexer is disposed on shutdown.
/// </summary>
public sealed class RedisServiceRegistrator : IServiceRegistrator, Inktide.API.Core.IStartup
{
    public void Register(IRegistrator registrator, IConfiguration configuration)
    {
        var redisSettings = new RedisSettings();
        configuration.GetSection(nameof(RedisSettings)).Bind(redisSettings);

        if (string.IsNullOrWhiteSpace(redisSettings.BaseAddress))
            throw new InvalidOperationException("RedisSettings:BaseAddress is required but not configured.");
        if (redisSettings.BasePort is <= 0 or > 65535)
            throw new InvalidOperationException("RedisSettings:BasePort must be a valid port (1–65535).");

        registrator.RegisterInstance(redisSettings);
        registrator.RegisterDelegate<IConnectionMultiplexer>(
            _ => ConnectionMultiplexer.Connect(redisSettings.ToConnectionString()),
            Reuse.Singleton);
    }

    public void ConfigureServices(HostBuilderContext ctx, IServiceCollection services)
        => services.AddHostedService<RedisLifetimeService>();
}

/// <summary>
/// Ensures <see cref="IConnectionMultiplexer"/> is gracefully closed when the host shuts down.
/// </summary>
internal sealed class RedisLifetimeService : IHostedService
{
    private readonly IConnectionMultiplexer _multiplexer;

    public RedisLifetimeService(IConnectionMultiplexer multiplexer)
        => _multiplexer = multiplexer;

    public Task StartAsync(CancellationToken ct) => Task.CompletedTask;

    public Task StopAsync(CancellationToken ct)
    {
        _multiplexer.Dispose();
        return Task.CompletedTask;
    }
}