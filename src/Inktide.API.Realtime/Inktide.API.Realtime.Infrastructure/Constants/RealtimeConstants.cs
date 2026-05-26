namespace Inktide.API.Realtime.Infrastructure.Constants;

internal static class RealtimeConstants
{
    internal const int MaxSignalRMessageBytes = 5 * 1024 * 1024;

    internal static class HubMethods
    {
        internal const string AudioReceived = "audioReceived";
        internal const string TextChunk     = "textChunk";
    }

    internal static class Groups
    {
        internal const string ChannelKeyPrefix = "ch:";
        internal static string ChannelKey(string channelId) => $"{ChannelKeyPrefix}{channelId}";
    }
}
