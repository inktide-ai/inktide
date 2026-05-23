namespace Inktide.API.Realtime.Infrastructure.Constants;

internal static class RealtimeConstants
{
    internal static class HubMethods
    {
        internal const string AudioReceived = "audioReceived";
        internal const string TextReceived  = "textReceived";
    }

    internal static class Groups
    {
        internal const string ChannelKeyPrefix = "ch:";
    }
}
