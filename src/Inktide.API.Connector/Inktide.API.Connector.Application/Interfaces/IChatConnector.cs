namespace Inktide.API.Connector.Application.Contracts;

/// <summary>Common interface for platform chat connectors (Twitch, YouTube, Discord, etc.).</summary>
public interface IChatConnector
{
    /// <summary>Platform identifier, e.g. "twitch" or "youtube".</summary>
    string PlatformId { get; }

    /// <summary>Returns true when the connector is active and receiving messages.</summary>
    bool IsConnected { get; }

    Task ConnectAsync(CancellationToken cancellationToken = default);

    Task DisconnectAsync(CancellationToken cancellationToken = default);

    /// <summary>Joins a channel at runtime and registers the soul routing for it.</summary>
    Task JoinChannelAsync(string channelId, Guid cardId, CancellationToken ct = default)
        => Task.CompletedTask;

    /// <summary>Leaves a channel at runtime and removes its soul routing entry.</summary>
    Task LeaveChannelAsync(string channelId, Guid cardId, CancellationToken ct = default)
        => Task.CompletedTask;
}
