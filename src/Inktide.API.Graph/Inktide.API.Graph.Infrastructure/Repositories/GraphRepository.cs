using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Entities;
using Inktide.API.Graph.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Graph.Infrastructure.Repositories;

public sealed class GraphRepository : IGraphRepository
{
    private readonly GraphDbContext _db;

    public GraphRepository(GraphDbContext db) => _db = db;

    public Task<GraphDefinition?> FindByProjectIdAsync(Guid projectId, CancellationToken ct = default) =>
        _db.GraphDefinitions.FirstOrDefaultAsync(g => g.ProjectId == projectId, ct);

    public Task<GraphDefinition?> FindByProjectAndUserAsync(Guid projectId, Guid userId, CancellationToken ct = default) =>
        _db.GraphDefinitions.FirstOrDefaultAsync(g => g.ProjectId == projectId && g.UserId == userId, ct);

    public async Task<GraphDefinition> UpsertAsync(GraphDefinition graph, CancellationToken ct = default)
    {
        // Look up by project_id — one graph per project.
        // Update userId if the row was created before ownership tracking was added.
        var existing = await _db.GraphDefinitions
            .FirstOrDefaultAsync(g => g.ProjectId == graph.ProjectId, ct);

        if (existing is null)
        {
            _db.GraphDefinitions.Add(graph);
        }
        else
        {
            if (existing.UserId == Guid.Empty)
                existing.UserId = graph.UserId;
            existing.Update(graph.Nodes, graph.Edges);
            _db.GraphDefinitions.Update(existing);
            graph = existing;
        }

        await _db.SaveChangesAsync(ct);
        return graph;
    }
}
