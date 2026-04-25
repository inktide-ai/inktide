using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>Fan-in: merges scatter results and persists/logs a single JSON artifact.</summary>
public interface ISynapseAggregationService
{
    Task AggregateAsync(MessageProcessingContext context, CancellationToken cancellationToken = default);
}
