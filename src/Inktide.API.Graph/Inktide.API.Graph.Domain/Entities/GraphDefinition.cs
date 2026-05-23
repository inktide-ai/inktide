using Inktide.API.Core.Generators;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Entities;

/// <summary>
/// One graph per Project. Stores the full node + edge topology.
/// Nodes and Edges are persisted as JSONB in PostgreSQL.
/// </summary>
public sealed class GraphDefinition
{
    private Guid _id;
    private Guid _projectId;
    private Guid _userId;
    private List<GraphNodeRecord> _nodes = [];
    private List<GraphEdgeRecord> _edges = [];
    private DateTime _updatedAt;

    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public Guid ProjectId
    {
        get => _projectId;
        set => _projectId = value;
    }

    public Guid UserId
    {
        get => _userId;
        set => _userId = value;
    }

    public List<GraphNodeRecord> Nodes
    {
        get => _nodes;
        set => _nodes = value;
    }

    public List<GraphEdgeRecord> Edges
    {
        get => _edges;
        set => _edges = value;
    }

    public DateTime UpdatedAt
    {
        get => _updatedAt;
        set => _updatedAt = value;
    }

    public static GraphDefinition Create(
        Guid projectId,
        Guid userId,
        IEnumerable<GraphNodeRecord> nodes,
        IEnumerable<GraphEdgeRecord> edges)
    {
        return new GraphDefinition
        {
            Id = IdGenerator.New(),
            ProjectId = projectId,
            UserId = userId,
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
            UpdatedAt = DateTime.UtcNow,
        };
    }

    public void Update(IEnumerable<GraphNodeRecord> nodes, IEnumerable<GraphEdgeRecord> edges)
    {
        _nodes = nodes.ToList();
        _edges = edges.ToList();
        _updatedAt = DateTime.UtcNow;
    }
}
