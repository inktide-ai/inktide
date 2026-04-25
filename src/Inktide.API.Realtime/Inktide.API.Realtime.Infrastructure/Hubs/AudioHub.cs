using Microsoft.AspNetCore.SignalR;

namespace Inktide.API.Realtime.Infrastructure.Hubs;

/// <summary>
/// Real-time audio delivery hub. Browser clients join a channel group to receive
/// synthesized audio payloads as they arrive from the TTS pipeline.
///
/// <para>Flow: client connects → calls <see cref="JoinChannel"/> with the Discord/platform
/// channel ID → receives <c>audioReceived</c> events pushed by <see cref="Messaging.BrowserAudioPublisher"/>.</para>
/// </summary>
public sealed class AudioHub : Hub
{
    /// <summary>Subscribe to audio events for a given platform channel ID.</summary>
    public Task JoinChannel(string channelId)
        => Groups.AddToGroupAsync(Context.ConnectionId, GroupKey(channelId));

    /// <summary>Unsubscribe from a channel's audio events.</summary>
    public Task LeaveChannel(string channelId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupKey(channelId));

    internal static string GroupKey(string channelId) => $"ch:{channelId}";
}
