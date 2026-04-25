namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// PostgreSQL mirror of a Qdrant memory vector.
/// Stores structured metadata for quota enforcement, analytics, and cascading deletes.
/// </summary>
public sealed class MemoryMetadata
{

    private Guid _id;
    private Guid _aiCardId;
    private string _qdrantPointId = string.Empty;
    private string _factText = string.Empty;
    private string _category = "general";
    private string _sourceType = "chat";
    private double _importance = 0.5;
    private DateTime _rememberedAt;
    private DateTime? _lastRecalledAt;
    private int _recallCount;
    private DateTime? _expiresAt;
    private AiCard? _aiCard;


    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public Guid AiCardId
    {
        get => _aiCardId;
        set => _aiCardId = value;
    }

    /// <summary>Reference to the vector in Qdrant.</summary>
    public string QdrantPointId
    {
        get => _qdrantPointId;
        set => _qdrantPointId = value;
    }

    public string FactText
    {
        get => _factText;
        set => _factText = value;
    }

    public string Category
    {
        get => _category;
        set => _category = value;
    }

    public string SourceType
    {
        get => _sourceType;
        set => _sourceType = value;
    }

    public double Importance
    {
        get => _importance;
        set => _importance = value;
    }

    public DateTime RememberedAt
    {
        get => _rememberedAt;
        set => _rememberedAt = value;
    }

    public DateTime? LastRecalledAt
    {
        get => _lastRecalledAt;
        set => _lastRecalledAt = value;
    }

    public int RecallCount
    {
        get => _recallCount;
        set => _recallCount = value;
    }

    public DateTime? ExpiresAt
    {
        get => _expiresAt;
        set => _expiresAt = value;
    }

    public AiCard? AiCard
    {
        get => _aiCard;
        set => _aiCard = value;
    }

}
