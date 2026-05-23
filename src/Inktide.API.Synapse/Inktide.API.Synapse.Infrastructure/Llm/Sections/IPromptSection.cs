using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Llm.Sections;

internal interface IPromptSection
{
    string? Build(SynapseAggregatedEnvelope envelope);
}
