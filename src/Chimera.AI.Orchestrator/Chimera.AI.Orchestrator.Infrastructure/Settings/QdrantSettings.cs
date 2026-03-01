using System.ComponentModel.DataAnnotations;

namespace Chimera.AI.Orchestrator.Infrastructure.Settings;

public sealed class QdrantSettings
{
    [Required(AllowEmptyStrings = false)]
    public string Host { get; set; } = "localhost";

    public int GrpcPort { get; set; } = 6334;

    [Required(AllowEmptyStrings = false)]
    public string CollectionName { get; set; } = "chat_memories";

    /// <summary>
    /// Must match the output dimension of the embedding model (nomic-embed-text = 768).
    /// </summary>
    public ulong VectorSize { get; set; } = 768;
}
