using Inktide.API.Connector.Application.Contracts;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Inktide.API.Connector.InktideChat.Health;

/// <summary>
/// Reports InktideChat connector health based on whether its consumer worker is running.
/// </summary>
public sealed class InktideChatHealthCheck : IHealthCheck
{
    private readonly IEnumerable<IChatConnector> _connectors;

    public InktideChatHealthCheck(IEnumerable<IChatConnector> connectors)
    {
        _connectors = connectors;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var connector = _connectors.FirstOrDefault(c => c.PlatformId == InktideChatConnector.PlatformIdValue);

        if (connector is null)
            return Task.FromResult(HealthCheckResult.Degraded("InktideChat connector not registered"));

        var result = connector.IsConnected
            ? HealthCheckResult.Healthy("InktideChat inbox is accepting messages")
            : HealthCheckResult.Unhealthy("InktideChat connector is not running");

        return Task.FromResult(result);
    }
}
