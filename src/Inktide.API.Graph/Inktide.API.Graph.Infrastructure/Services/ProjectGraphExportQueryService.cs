using System.Text.Json;
using Inktide.API.Core.Contracts;
using Inktide.API.Graph.Domain.Contracts;

namespace Inktide.API.Graph.Infrastructure.Services;

internal sealed class ProjectGraphExportQueryService : IProjectGraphExportQuery
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly IGraphRepository _graphRepo;

    public ProjectGraphExportQueryService(IGraphRepository graphRepo)
    {
        _graphRepo = graphRepo ?? throw new ArgumentNullException(nameof(graphRepo));
    }

    public async Task<GraphExportSnapshot?> FindByProjectIdAsync(Guid projectId, CancellationToken ct = default)
    {
        var graph = await _graphRepo.FindByProjectIdAsync(projectId, ct).ConfigureAwait(false);
        if (graph is null) return null;

        var brainJson = JsonSerializer.Serialize(
            new { nodes = graph.Nodes, edges = graph.Edges },
            JsonOpts);

        return new GraphExportSnapshot(brainJson);
    }
}
