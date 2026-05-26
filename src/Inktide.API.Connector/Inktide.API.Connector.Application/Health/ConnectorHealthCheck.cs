using Inktide.API.Connector.Application.Contracts;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Inktide.API.Connector.Application.Health;

/// <summary>
/// Generic health check for any <see cref="IChatConnector"/> identified by its
/// <see cref="IChatConnector.PlatformId"/>. Replaces per-platform boilerplate classes.
/// </summary>
public sealed class ConnectorHealthCheck(
    IEnumerable<IChatConnector> connectors,
    string platformId,
    string healthyMessage,
    string unhealthyMessage) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var connector = connectors.FirstOrDefault(c => c.PlatformId == platformId);

        if (connector is null)
            return Task.FromResult(
                HealthCheckResult.Degraded($"{platformId} connector not registered"));

        return Task.FromResult(connector.IsConnected
            ? HealthCheckResult.Healthy(healthyMessage)
            : HealthCheckResult.Unhealthy(unhealthyMessage));
    }
}
