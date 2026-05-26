using Inktide.API.Realtime.Infrastructure.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Realtime.Infrastructure.Hubs;

/// <summary>
/// Real-time audio delivery hub. Browser clients join a channel group to receive
/// synthesized audio payloads as they arrive from the TTS pipeline.
///
/// <para>Flow: client connects → calls <see cref="JoinChannel"/> with the Discord/platform
/// channel ID → receives <c>audioReceived</c> events pushed by <see cref="Messaging.BrowserAudioPublisher"/>.</para>
///
/// <para>SignalR JWT note: browsers cannot set Authorization headers on WebSocket connections.
/// The frontend must pass the token as <c>?access_token=&lt;jwt&gt;</c> query param.
/// Configure the JWT bearer handler to read it from the query string.</para>
/// </summary>
[Authorize]
public sealed class AudioHub(ILogger<AudioHub> logger) : Hub
{
    /// <summary>Subscribe to audio events for a given platform channel ID.</summary>
    public Task JoinChannel(string channelId)
        => Groups.AddToGroupAsync(Context.ConnectionId, RealtimeConstants.Groups.ChannelKey(channelId));

    /// <summary>Unsubscribe from a channel's audio events.</summary>
    public Task LeaveChannel(string channelId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeConstants.Groups.ChannelKey(channelId));

    public override async Task OnConnectedAsync()
    {
        logger.LogDebug("SignalR client connected: {ConnectionId} User={UserId}",
            Context.ConnectionId, Context.UserIdentifier);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception is not null)
            logger.LogWarning(exception, "SignalR client disconnected abnormally: {ConnectionId}", Context.ConnectionId);
        else
            logger.LogDebug("SignalR client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
