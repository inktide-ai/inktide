namespace Inktide.API.Core.Providers;

/// <summary>
/// LLM providers that run on the user's own machine or network (Ollama, LM Studio, ...).
/// They take no API key, serve the OpenAI API under <c>/v1</c> and are usually reached over
/// plain HTTP, so card validation and the chat service factory treat them differently from
/// hosted providers. IDs match the web catalog (apps/web/shared/data/llm-provider-catalog.ts).
/// </summary>
public static class LocalLlmProviders
{
    private static readonly HashSet<string> Ids = new(StringComparer.OrdinalIgnoreCase)
    {
        "ollama", "lmstudio", "jan", "localai", "vllm", "llamacpp",
    };

    public static bool Contains(string? providerId) => providerId is not null && Ids.Contains(providerId);
}
