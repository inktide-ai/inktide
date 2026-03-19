using Chimera.API.Connector.Application.Contracts;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Chimera.API.Connector.Discord.Health;

/// <summary>
/// Reports Discord connector health based on its Gateway WebSocket connection state.
/// </summary>
public sealed class DiscordHealthCheck : IHealthCheck
{
    private readonly IEnumerable<IChatConnector> _connectors;

    public DiscordHealthCheck(IEnumerable<IChatConnector> connectors)
    {
        _connectors = connectors;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        
        var discord = _connectors.FirstOrDefault(c => c.PlatformId == DiscordConnector.PlatformIdValue);

        if (discord is null) {
            return Task.FromResult(HealthCheckResult.Degraded("Discord connector not registered"));
        }

        var result = discord.IsConnected
            ? HealthCheckResult.Healthy("Discord Gateway WebSocket connected")
            : HealthCheckResult.Unhealthy("Discord Gateway WebSocket disconnected");

        return Task.FromResult(result);
    }
    
}
