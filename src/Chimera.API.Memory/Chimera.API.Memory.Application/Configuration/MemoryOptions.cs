namespace Chimera.API.Memory.Application.Configuration;

public sealed class MemoryOptions
{
    public const string SectionName = "MemorySettings";

    /// <summary>Default top-K for Qdrant semantic search.</summary>
    public int TopK { get; set; } = 5;

    /// <summary>Max conversation turns to keep in Redis session buffer.</summary>
    public int MaxHistoryTurns { get; set; } = 30;

    /// <summary>Ingestion worker flushes when batch reaches this size.</summary>
    public int IngestionBatchSize { get; set; } = 5;

    /// <summary>Ingestion worker flushes after this many milliseconds even if batch is not full.</summary>
    public int IngestionBatchWindowMs { get; set; } = 3000;

    /// <summary>Capacity of the bounded ingestion channel. Oldest entries are dropped on overflow.</summary>
    public int IngestionChannelCapacity { get; set; } = 500;

    /// <summary>Retention period for memories in days. Used to compute ExpiresAt.</summary>
    public int RetentionDays { get; set; } = 90;

    /// <summary>Facts below this importance score are discarded during ingestion.</summary>
    public double MinImportanceThreshold { get; set; } = 0.3;

    /// <summary>Base URL of the Scribe Python worker (embedding + fact extraction).</summary>
    public string ScribeBaseUrl { get; set; } = "http://localhost:8001";
}
