using Chimera.API.Connector.Application.Contracts;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Chimera.API.Connector.ChimeraChat.Health;

/// <summary>
/// Reports ChimeraChat connector health based on whether its consumer worker is running.
/// </summary>
public sealed class ChimeraChatHealthCheck : IHealthCheck
{
    private readonly IEnumerable<IChatConnector> _connectors;

    public ChimeraChatHealthCheck(IEnumerable<IChatConnector> connectors)
    {
        _connectors = connectors;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var connector = _connectors.FirstOrDefault(c => c.PlatformId == ChimeraChatConnector.PlatformIdValue);

        if (connector is null)
            return Task.FromResult(HealthCheckResult.Degraded("ChimeraChat connector not registered"));

        var result = connector.IsConnected
            ? HealthCheckResult.Healthy("ChimeraChat inbox is accepting messages")
            : HealthCheckResult.Unhealthy("ChimeraChat connector is not running");

        return Task.FromResult(result);
    }
}
