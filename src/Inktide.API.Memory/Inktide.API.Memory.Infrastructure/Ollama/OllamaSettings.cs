namespace Inktide.API.Memory.Infrastructure.Ollama;

public sealed class OllamaSettings
{
    public string Host { get; set; } = "http://localhost";
    public int Port { get; set; } = 11434;
    public string EmbeddingModel { get; set; } = "nomic-embed-text";
}
