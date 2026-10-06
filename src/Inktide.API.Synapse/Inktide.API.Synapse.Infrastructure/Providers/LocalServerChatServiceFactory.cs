using Inktide.API.Core.Providers;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace Inktide.API.Synapse.Infrastructure.Providers;

/// <summary>
/// Factory for local inference servers (Ollama, LM Studio, Jan, LocalAI, vLLM, llama.cpp).
/// They all serve chat completions at {host}/v1/chat/completions, but users configure the root
/// URL ({host}:11434, {host}:1234, ...), so the base URL is normalized to end with /v1.
/// They take no API key: an empty one is passed as null, which the OpenAI client accepts for a
/// custom endpoint and an empty string it does not.
/// </summary>
internal sealed class LocalServerChatServiceFactory : IChatServiceFactory
{
    private readonly IHttpClientFactory _http;

    public LocalServerChatServiceFactory(IHttpClientFactory http)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
    }

    public int Priority => 10;

    public bool CanHandle(string providerId) => LocalLlmProviders.Contains(providerId);

    public IChatCompletionService Create(string modelId, string apiKey, string? baseUrl)
    {
        var normalizedUrl = NormalizeBaseUrl(baseUrl ?? "http://localhost:11434");
#pragma warning disable SKEXP0010
        return new OpenAIChatCompletionService(
            modelId,
            new Uri(normalizedUrl),
            string.IsNullOrEmpty(apiKey) ? null : apiKey,
            httpClient: _http.CreateClient(LlmHttpClient.Name));
#pragma warning restore SKEXP0010
    }

    private static string NormalizeBaseUrl(string rawUrl)
    {
        var trimmed = rawUrl.TrimEnd('/');
        return trimmed.EndsWith("/v1", StringComparison.OrdinalIgnoreCase) ? trimmed : trimmed + "/v1";
    }
}
