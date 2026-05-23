namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Recent screen events produced by the Screen Awareness vision pipeline.
/// Set in <see cref="MessageProcessingContext"/> by <c>ScreenContextScatterShard</c>
/// and carried in <see cref="SynapseAggregatedEnvelope"/> to the LLM prompt builder.
/// </summary>
public sealed record ScreenContext(
    IReadOnlyList<ScreenEventSummary> RecentEvents,
    DateTimeOffset LastUpdated);
