namespace Inktide.API.Memory.Infrastructure.Qdrant;

public sealed class QdrantSettings
{
    public string Host { get; set; } = string.Empty;
    public int GrpcPort { get; set; } = 0;
    public string CollectionName { get; set; } = "chat_memories";

    /// <summary>Embedding dimension. Must match the model configured in <c>OllamaSettings:EmbeddingModel</c>.</summary>
    public int VectorSize { get; set; } = 768;
}
