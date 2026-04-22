namespace Chimera.API.Connector.Application.Contracts;

/// <summary>Common interface for platform chat connectors (Twitch, YouTube, Discord, etc.).</summary>
public interface IChatConnector
{
    /// <summary>Platform identifier, e.g. "twitch" or "youtube".</summary>
    string PlatformId { get; }

    /// <summary>Returns true when the connector is active and receiving messages.</summary>
    bool IsConnected { get; }

    Task ConnectAsync(CancellationToken cancellationToken = default);

    Task DisconnectAsync(CancellationToken cancellationToken = default);
    
}
