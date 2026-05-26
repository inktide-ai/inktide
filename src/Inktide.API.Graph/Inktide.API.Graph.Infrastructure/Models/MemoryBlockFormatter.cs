using Inktide.API.Memory.Domain.Models;

namespace Inktide.API.Graph.Infrastructure.Models;

internal static class MemoryBlockFormatter
{
    internal static string Append(string context, IReadOnlyList<MemoryRecord> memories)
    {
        if (memories.Count == 0) return context;
        var block = string.Join("\n", memories.Select(m => $"- {m.FactText}"));
        return $"{context}\n\nRelevant context from memory:\n{block}";
    }
}
