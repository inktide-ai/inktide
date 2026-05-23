namespace Inktide.API.Synapse.Infrastructure.Constants;

internal static class SynapseConstants
{
    internal static class Cache
    {
        internal const string ChannelContextKeyPrefix = "ctx:channel:";
        internal static readonly TimeSpan ChannelContextTtl = TimeSpan.FromMinutes(5);
    }

    internal static class Providers
    {
        internal const string EchoProvider = "echo";
    }

    internal static class Platforms
    {
        internal const string InktideChat = "inktide-chat";
    }

    internal static class ShardIds
    {
        internal const string Rag     = "rag";
        internal const string Emotion = "emotion";
        internal const string Screen  = "screen";
        internal const string Session = "session";
        internal const string Soul    = "soul";
        internal const string Webhook = "webhook";
    }

    internal static class Prompts
    {
        internal static readonly TimeSpan ScreenContextWindow = TimeSpan.FromSeconds(60);
        internal const int MaxFreshScreenEvents = 5;
    }

    internal static class Messaging
    {
        internal static readonly TimeSpan MessageStalenessThreshold = TimeSpan.FromSeconds(10);
    }
}
