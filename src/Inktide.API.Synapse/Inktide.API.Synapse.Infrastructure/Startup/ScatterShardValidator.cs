using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Synapse.Infrastructure.Startup;

// Required shards: RAG only. Session is optional - absent = responses without conversation history
// (degraded but not broken). Emotion and Screen are always decorative.
// Future: bool IsRequired { get; } on IPipelineStage makes this data-driven.
internal sealed class ScatterShardValidator(
    IServiceScopeFactory scopeFactory,
    ILogger<ScatterShardValidator> logger) : IHostedService
{
    private static readonly string[] RequiredShards = [SynapseConstants.ShardIds.Rag];

    public Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var shards = scope.ServiceProvider.GetServices<IPipelineStage>();
        var registered = shards.Select(s => s.ShardId).ToHashSet(StringComparer.Ordinal);

        foreach (var required in RequiredShards)
        {
            if (!registered.Contains(required))
                throw new InvalidOperationException(
                    $"Required pipeline shard '{required}' is not registered. " +
                    $"Ensure the corresponding module (e.g. Memory.Infrastructure) is enabled in appsettings.json.");
        }

        logger.LogInformation("Pipeline shards validated: [{Shards}]", string.Join(", ", registered));
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
