namespace Chimera.API.Memory.Infrastructure.Qdrant;

public sealed class QdrantSettings
{

    public string Host { get; set; } = "localhost";
    public int GrpcPort { get; set; } = 6334;
    public string CollectionName { get; set; } = "chat_memories";
    
}
