using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace Inktide.API.Synapse.Infrastructure.Providers;

/// <summary>
/// Factory for Ollama's OpenAI-compatible inference endpoint.
/// Normalizes the user-supplied base URL to always include /v1,
/// since Ollama exposes chat completions at {host}/v1/chat/completions
/// but users typically configure the root URL ({host}:11434) without the /v1 suffix.
/// </summary>
internal sealed class OllamaChatServiceFactory : IChatServiceFactory
{
    public int Priority => 10;

    public bool CanHandle(string providerId) =>
        providerId.Equals("ollama", StringComparison.OrdinalIgnoreCase);

    public IChatCompletionService Create(string modelId, string apiKey, string? baseUrl)
    {
        var normalizedUrl = NormalizeBaseUrl(baseUrl ?? "http://localhost:11434");
#pragma warning disable SKEXP0010
        return new OpenAIChatCompletionService(modelId, new Uri(normalizedUrl), apiKey);
#pragma warning restore SKEXP0010
    }

    private static string NormalizeBaseUrl(string rawUrl)
    {
        var trimmed = rawUrl.TrimEnd('/');
        return trimmed.EndsWith("/v1", StringComparison.OrdinalIgnoreCase) ? trimmed : trimmed + "/v1";
    }
}
