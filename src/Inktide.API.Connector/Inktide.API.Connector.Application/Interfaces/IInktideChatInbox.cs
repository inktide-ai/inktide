namespace Inktide.API.Connector.Application.Contracts;

/// <summary>
/// Entry point for inbound web chat messages arriving via SignalR.
/// Implemented by InktideChatConnector; injected into AudioHub to bridge
/// browser → Synapse ingest pipeline without coupling Realtime to a concrete connector.
/// </summary>
public interface IInktideChatInbox
{
    /// <summary>
    /// Enqueues a message from a browser client for Synapse pipeline processing.
    /// Non-blocking — returns <c>false</c> if the internal buffer is at capacity.
    /// </summary>
    bool TryEnqueue(string channelId, string userId, string userName, string text);
}
