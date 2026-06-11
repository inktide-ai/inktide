namespace Inktide.API.Memory.Infrastructure.Ollama;

public sealed class OllamaSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 0;
    public string EmbeddingModel { get; set; } = "nomic-embed-text";
}
