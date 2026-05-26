using System.Text;
using Inktide.API.Core.Contracts;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;

namespace Inktide.API.Synapse.Infrastructure.Llm.Sections;

internal sealed class PersonalitySection : IPromptSection
{
    public string? Build(SynapseAggregatedEnvelope envelope)
    {
        var ctx = envelope.Context;
        if (ctx is null) return null;

        var plugins = ctx.Plugins;
        if (!SynapseConstants.PluginGate.IsEnabled(plugins, SynapseConstants.ShardIds.Soul)) return null;

        var sb = new StringBuilder();
        if (!string.IsNullOrEmpty(ctx.Personality))
            sb.AppendLine(ctx.Personality);
        if (!string.IsNullOrEmpty(ctx.PersonalityDirective))
            sb.AppendLine(ctx.PersonalityDirective);

        var result = sb.ToString().TrimEnd();
        return result.Length > 0 ? result : null;
    }
}
