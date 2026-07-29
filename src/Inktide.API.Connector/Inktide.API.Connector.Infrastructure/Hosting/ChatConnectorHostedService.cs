using Inktide.API.Connector.Application.Contracts;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.Infrastructure.Hosting;

/// <summary>
/// Starts all registered IChatConnector instances (Twitch, YouTube, etc.) on application startup.
/// On shutdown calls DisconnectAsync on each connector; DisposeAsync is handled by the DI container.
/// </summary>
public sealed class ChatConnectorHostedService : IHostedService
{
    private readonly ILogger<ChatConnectorHostedService> _logger;
    private readonly IEnumerable<IChatConnector> _connectors;

    public ChatConnectorHostedService(
        ILogger<ChatConnectorHostedService> logger,
        IEnumerable<IChatConnector> connectors)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _connectors = connectors ?? throw new ArgumentNullException(nameof(connectors));
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var list = _connectors.ToList();
        _logger.LogInformation("Starting {Count} chat connector(s): {Platforms}",
            list.Count,
            string.Join(", ", list.Select(c => c.PlatformId)));

        await Task.WhenAll(list.Select(async connector =>
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
        }));
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        // DisposeAsync is intentionally NOT called here - connectors are DI singletons and the
        // container calls DisposeAsync on IAsyncDisposable instances when it is disposed.
        // Calling it here would cause double-dispose.
        foreach (var connector in _connectors)
        {
            try
            {
                await connector.DisconnectAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping {PlatformId}", connector.PlatformId);
            }
        }
    }
}
