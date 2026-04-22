namespace Chimera.API.Synapse.Application.Configuration;

public sealed class EmotionClassificationOptions
{
    public const string SectionName = nameof(EmotionClassificationOptions);

    /// <summary>Ollama base URL. Default: http://localhost:11434</summary>
    public string OllamaBaseUrl { get; set; } = "http://localhost:11434";

    /// <summary>
    /// Model used for classification. Should be small and fast.
    /// Default: qwen2.5:7b — already available in the standard Chimera Ollama setup.
    /// </summary>
    public string Model { get; set; } = "qwen2.5:7b";

    /// <summary>HTTP request timeout in milliseconds. Default: 5000.</summary>
    public int TimeoutMs { get; set; } = 5_000;
}
