using System.ComponentModel.DataAnnotations;

namespace Chimera.AI.Orchestrator.Infrastructure.Settings;

public sealed class OllamaSettings
{
    [Required(AllowEmptyStrings = false)]
    public string Host { get; set; } = "http://localhost";

    public int Port { get; set; } = 11434;

    [Required(AllowEmptyStrings = false)]
    public string EmbeddingModel { get; set; } = "nomic-embed-text";

    public string BaseUrl => $"{Host.TrimEnd('/')}:{Port}";
}
