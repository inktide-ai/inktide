namespace Inktide.API.Synapse.Infrastructure.ChannelContext;

internal static class InktideChatChannelParser
{
    internal static bool TryParseCardId(string channelId, out Guid cardId)
    {
        var segment = channelId.Split(':')[0];
        return Guid.TryParse(segment, out cardId);
    }
}
