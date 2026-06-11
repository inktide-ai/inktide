namespace Inktide.API.Connector.InktideChat;

/// <summary>
/// InktideChat channel ID format: "{cardId}:{userId}"
/// Both parts are standard UUID strings (lowercase, hyphenated).
/// Example: "019e96b7-afb4-7b5d-9f31-4b887d4ec0bd:550e8400-e29b-41d4-a716-446655440000"
/// Frontend counterpart: apps/web/shared/lib/channel-id.ts → buildChannelId()
/// </summary>
internal static class InktideChatChannelId
{
    internal static bool BelongsToUser(string channelId, string userId)
    {
        var sep = channelId.IndexOf(':');
        if (sep < 0) return false;
        return channelId.AsSpan(sep + 1).Equals(userId.AsSpan(), StringComparison.Ordinal);
    }
}
