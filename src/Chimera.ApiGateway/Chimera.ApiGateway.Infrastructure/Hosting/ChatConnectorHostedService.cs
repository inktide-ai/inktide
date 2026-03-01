using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Chimera.ApiGateway.Application.Contracts.Streaming;

namespace Chimera.ApiGateway.Infrastructure.Hosting;

/// <summary>
/// Starts all registered IChatConnector instances (Twitch, YouTube, etc.) on application startup.
/// Disposes connectors that implement IAsyncDisposable on shutdown.
/// </summary>
public sealed class ChatConnectorHostedService : IHostedService
{
    private readonly ILogger<ChatConnectorHostedService> _logger;
    private readonly IEnumerable<IChatConnector> _connectors;

    public ChatConnectorHostedService(
        ILogger<ChatConnectorHostedService> logger,
        IEnumerable<IChatConnector> connectors)
    {
        _logger = logger;
        _connectors = connectors;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var list = _connectors.ToList();
        _logger.LogInformation("Starting {Count} chat connector(s): {Platforms}",
            list.Count,
            string.Join(", ", list.Select(c => c.PlatformId)));

        foreach (var connector in list)
        {
            try
            {
                await connector.ConnectAsync(cancellationToken);
                _logger.LogInformation("Connector {PlatformId} started successfully", connector.PlatformId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect {PlatformId}", connector.PlatformId);
            }
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        foreach (var connector in _connectors)
        {
            try
            {
                await connector.DisconnectAsync(cancellationToken);

                if (connector is IAsyncDisposable disposable) {
                    await disposable.DisposeAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping {PlatformId}", connector.PlatformId);
            }
        }
    }
}
