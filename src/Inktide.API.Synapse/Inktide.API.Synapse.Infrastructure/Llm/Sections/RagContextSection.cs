using Inktide.API.Core.Contracts;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;

namespace Inktide.API.Synapse.Infrastructure.Llm.Sections;

internal sealed class RagContextSection : IPromptSection
{
    public string? Build(SynapseAggregatedEnvelope envelope)
    {
        var plugins = envelope.Context?.Plugins;
        if (!SynapseConstants.PluginGate.IsEnabled(plugins, SynapseConstants.ShardIds.Rag)) return null;

        var memories = envelope.Rag?.Memories;
        if (memories is not { Count: > 0 }) return null;

        var memLines = string.Join("\n", memories.Select(m => $"- {m.Text}"));
        return $"Relevant context from memory:\n{memLines}";
    }
}
