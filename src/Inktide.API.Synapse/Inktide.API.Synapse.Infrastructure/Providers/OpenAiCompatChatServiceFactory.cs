using Inktide.API.Synapse.Application.Interfaces;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace Inktide.API.Synapse.Infrastructure.Providers;

/// <summary>
/// Catch-all factory for any provider that exposes an OpenAI-compatible <c>/v1/chat/completions</c> endpoint.
///
/// Covers: Ollama, OpenAI, Anthropic (via /v1 compat), DeepSeek, Groq, OpenRouter, Fireworks,
/// Together AI, LM Studio, Azure OpenAI - anything with a <c>baseUrl</c> pointing at a /v1 endpoint.
///
/// Priority = 0 (lowest) so provider-specific factories registered with higher Priority always win.
/// </summary>
internal sealed class OpenAiCompatChatServiceFactory : IChatServiceFactory
{
    private readonly IHttpClientFactory _http;

    public OpenAiCompatChatServiceFactory(IHttpClientFactory http)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
    }

    public int Priority => 0;

    /// <summary>
    /// Returns <c>true</c> for every provider - this is the default catch-all.
    /// Override by registering a factory with higher <see cref="Priority"/> for specific provider IDs.
    /// </summary>
    public bool CanHandle(string providerId) => true;

    public IChatCompletionService Create(string modelId, string apiKey, string? baseUrl)
    {
        var httpClient = _http.CreateClient(LlmHttpClient.Name);
#pragma warning disable SKEXP0010
        if (baseUrl is null)
            return new OpenAIChatCompletionService(modelId, apiKey, httpClient: httpClient);

        return new OpenAIChatCompletionService(modelId, new Uri(baseUrl.TrimEnd('/')), apiKey, httpClient: httpClient);
#pragma warning restore SKEXP0010
    }
}
