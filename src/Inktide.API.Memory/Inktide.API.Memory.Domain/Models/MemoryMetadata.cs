namespace Inktide.API.Memory.Domain.Models;

/// <summary>
/// PostgreSQL mirror of a Qdrant memory vector owned by the Memory bounded context.
/// CharacterId is a correlation identifier — no EF navigation to Soul's AiCard entity.
/// </summary>
public sealed class MemoryMetadata
{
    public Guid Id { get; set; }
    public Guid CharacterId { get; set; }
    public string QdrantPointId { get; set; } = string.Empty;
    public string FactText { get; set; } = string.Empty;
    public string Category { get; set; } = "general";
    public string SourceType { get; set; } = "chat";
    public double Importance { get; set; } = 0.5;
    public DateTime RememberedAt { get; set; }
    public DateTime? LastRecalledAt { get; set; }
    public int RecallCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
