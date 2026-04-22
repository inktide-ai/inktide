namespace Chimera.API.Synapse.Application.Configuration;

/// <summary>
/// Top-level configuration for all LLM providers available to the Synapse pipeline.
/// Each entry is keyed by the provider ID that matches <c>LlmCatalogEntry.Provider</c>
/// stored on an AiCard (e.g. "ollama", "openai", "openrouter").
/// </summary>
public sealed class LlmProvidersSettings
{
    public const string SectionName = "LlmProviders";

    public Dictionary<string, LlmProviderConfig> Providers { get; set; } = new();
}

/// <summary>
/// Connection configuration for a single LLM provider.
/// API keys must be supplied via user secrets or environment variables — not committed to appsettings.
/// </summary>
public sealed class LlmProviderConfig
{
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Determines which Semantic Kernel connector is used.
    /// Supported values: "openai-compat" (default), "azure-openai".
    /// "openai-compat" covers Ollama, OpenAI, OpenRouter, Groq, DeepSeek, LM Studio,
    /// Fireworks, Together, and any other provider that exposes an OpenAI-compatible /v1 API.
    /// </summary>
    public string ProviderType { get; set; } = "openai-compat";

    /// <summary>API key. For Ollama set to any non-empty string (e.g. "ollama").</summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// Base URL for the provider. Required for self-hosted or non-standard endpoints.
    /// Examples: "http://localhost:11434/v1" (Ollama), "https://openrouter.ai/api/v1".
    /// Leave null for the default OpenAI endpoint.
    /// </summary>
    public string? BaseUrl { get; set; }

    /// <summary>
    /// Model ID used when the AiCard has no specific model configured
    /// or when the provider is used as a fallback.
    /// </summary>
    public string FallbackModel { get; set; } = "default";

    // Azure OpenAI only
    public string? AzureDeploymentName { get; set; }
}
