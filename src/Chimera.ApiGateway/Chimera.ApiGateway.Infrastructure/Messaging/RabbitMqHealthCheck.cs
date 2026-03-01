using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Chimera.ApiGateway.Infrastructure.Messaging;

/// <summary>Reports RabbitMQ connection health via <see cref="IRabbitMqChannelProvider.IsConnected"/>.</summary>
public sealed class RabbitMqHealthCheck : IHealthCheck
{
    #region Fields

    private readonly IRabbitMqChannelProvider _provider;

    #endregion

    #region Constructors

    public RabbitMqHealthCheck(IRabbitMqChannelProvider provider)
    {
        _provider = provider;
    }

    #endregion

    #region Public Methods

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var result = _provider.IsConnected
            ? HealthCheckResult.Healthy("RabbitMQ connection is open.")
            : HealthCheckResult.Unhealthy("RabbitMQ connection is closed.");

        return Task.FromResult(result);
    }

    #endregion
}
