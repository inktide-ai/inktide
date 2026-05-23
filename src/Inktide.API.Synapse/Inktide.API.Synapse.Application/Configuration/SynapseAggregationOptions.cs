namespace Inktide.API.Synapse.Application.Configuration;

public sealed class SynapseAggregationOptions
{
    public const string SectionName = "SynapseAggregation";

    /// <summary>Redis stream key where aggregated envelopes are published for the LLM worker.
    /// Default matches <c>Inktide.API.Core.Constants.StreamNames.LlmReady</c>.</summary>
    public string LlmStreamName { get; set; } = "synapse.llm.ready";

    /// <summary>Approximate MAXLEN for the LLM stream (~N).</summary>
    public long ApproximateMaxLength { get; set; } = 10_000;
}
