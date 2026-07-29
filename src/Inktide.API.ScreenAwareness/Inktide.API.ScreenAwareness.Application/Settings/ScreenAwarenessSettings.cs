namespace Inktide.API.ScreenAwareness.Application.Settings;

public sealed class ScreenAwarenessSettings
{
    public const string SectionName = "ScreenAwareness";

    /// <summary>Global kill-switch. When false, all frame ingestion returns FeatureDisabled.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>"ollama" or "anthropic".</summary>
    public string VisionProvider { get; set; } = "ollama";

    public string OllamaBaseUrl { get; set; } = string.Empty;
    public string OllamaVisionModel { get; set; } = "llava:7b";

    public string? AnthropicApiKey { get; set; }
    public string AnthropicModel { get; set; } = "claude-haiku-4-5";

    /// <summary>pHash Hamming distance threshold (0-64). Frames with distance below this are deduplicated.</summary>
    public int PHashThresholdDefault { get; set; } = 10;

    public int FreePlanHourlyBudget { get; set; } = 300;
    public int ProPlanHourlyBudget { get; set; } = 5000;

    /// <summary>Maximum milliseconds to wait for a vision model response before dropping the frame.</summary>
    public int VisionTimeoutMs { get; set; } = 5000;

    /// <summary>How far back (in seconds) the scatter shard looks for relevant screen events.</summary>
    public int ContextWindowSeconds { get; set; } = 60;
}
