namespace Inktide.API.Memory.Application.Configuration;

public sealed class MemoryOptions
{

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

    /// <summary>Base URL of the Scribe Python worker (fact extraction only — embeddings are handled by Ollama via SK).</summary>
    public string ScribeBaseUrl { get; set; } = "http://localhost:8001";
    
}
