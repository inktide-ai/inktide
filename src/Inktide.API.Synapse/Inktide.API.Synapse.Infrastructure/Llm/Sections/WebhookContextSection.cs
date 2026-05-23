using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Llm.Sections;

internal sealed class WebhookContextSection : IPromptSection
{
    public string? Build(SynapseAggregatedEnvelope envelope)
    {
        if (string.IsNullOrWhiteSpace(envelope.Webhook?.Context)) return null;
        return $"ADDITIONAL CONTEXT (from webhook):\n{envelope.Webhook.Context}";
    }
}
