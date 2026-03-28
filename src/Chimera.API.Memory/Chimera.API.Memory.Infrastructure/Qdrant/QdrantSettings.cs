namespace Chimera.API.Memory.Infrastructure.Qdrant;

public sealed class QdrantSettings
{
    public const string SectionName = "QdrantSettings";

    public string Host { get; set; } = "localhost";
    public int GrpcPort { get; set; } = 6334;
    public string CollectionName { get; set; } = "chat_memories";
    public int VectorSize { get; set; } = 768;
}
