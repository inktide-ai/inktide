using Microsoft.Extensions.Diagnostics.HealthChecks;
using Chimera.ApiGateway.Application.Contracts.Streaming;

namespace Chimera.ApiGateway.Twitch.Health;

/// <summary>
/// Reports Twitch connector health based on its WebSocket connection state.
/// </summary>
public sealed class TwitchHealthCheck : IHealthCheck
{
    private readonly IEnumerable<IChatConnector> _connectors;

    public TwitchHealthCheck(IEnumerable<IChatConnector> connectors)
    {
        _connectors = connectors;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var twitch = _connectors.FirstOrDefault(c => c.PlatformId == TwitchConnector.PlatformIdValue);

        if (twitch is null) {
            return Task.FromResult(HealthCheckResult.Degraded("Twitch connector not registered"));
        }

        var result = twitch.IsConnected
            ? HealthCheckResult.Healthy("Twitch EventSub WebSocket connected")
            : HealthCheckResult.Unhealthy("Twitch EventSub WebSocket disconnected");

        return Task.FromResult(result);
    }
}
