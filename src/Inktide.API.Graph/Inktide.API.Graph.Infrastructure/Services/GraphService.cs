using Inktide.API.Graph.Application.Interfaces;
using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Infrastructure.Services;

public sealed class GraphService : IGraphService
{
    private readonly IGraphRepository _repository;

    public GraphService(IGraphRepository repository) => _repository = repository;

    public Task<GraphDefinition?> GetByProjectAsync(Guid projectId, Guid userId, CancellationToken ct = default) =>
        _repository.FindByProjectAndUserAsync(projectId, userId, ct);

    public async Task<GraphDefinition> SaveAsync(
        Guid projectId,
        Guid userId,
        IEnumerable<GraphNodeRecord> nodes,
        IEnumerable<GraphEdgeRecord> edges,
        CancellationToken ct = default)
    {
        var graph = GraphDefinition.Create(projectId, userId, nodes, edges);
        return await _repository.UpsertAsync(graph, ct);
    }
}
