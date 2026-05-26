using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Messaging;

internal static class StreamEntryExtensions
{
    internal static string? GetField(this StreamEntry entry, string field)
    {
        foreach (var v in entry.Values)
            if (v.Name.ToString() == field) return v.Value.ToString();
        return null;
    }
}
