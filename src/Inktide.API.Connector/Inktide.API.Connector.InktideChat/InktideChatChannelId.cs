namespace Inktide.API.Connector.InktideChat;

internal static class InktideChatChannelId
{
    internal static bool BelongsToUser(string channelId, string userId)
    {
        var sep = channelId.IndexOf(':');
        if (sep < 0) return false;
        return channelId.AsSpan(sep + 1).Equals(userId.AsSpan(), StringComparison.Ordinal);
    }
}
