using System.Text.Json;
using Inktide.API.Core.Contracts;

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

    /// <summary>Synthetic message text that marks an autonomous idle trigger from IdleEventDispatcher.</summary>
    internal const string AutonomousIdleTrigger = "[INTERNAL:autonomous_idle]";

    internal static class Json
    {
        internal static readonly JsonSerializerOptions Read = new()
        {
            PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
        };

        internal static readonly JsonSerializerOptions Write = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        internal static readonly JsonSerializerOptions ReadCaseInsensitive = new()
        {
            PropertyNameCaseInsensitive = true,
        };
    }

    /// <summary>
    /// Centralises plugin enable/disable resolution so every call site uses the same semantics:
    /// null plugins (= no project linked) → all features ON (backwards compatible).
    /// </summary>
    internal static class PluginGate
    {
        internal static bool IsEnabled(IReadOnlyList<ProjectPluginDto>? plugins, string pluginId)
            => plugins is null
            || (plugins.FirstOrDefault(p => p.PluginId == pluginId)?.IsEnabled ?? true);
    }
}
