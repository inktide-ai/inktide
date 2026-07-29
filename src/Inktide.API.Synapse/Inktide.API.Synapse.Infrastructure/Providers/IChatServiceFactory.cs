using Microsoft.SemanticKernel.ChatCompletion;

namespace Inktide.API.Synapse.Infrastructure.Providers;

/// <summary>
/// Factory that creates an <see cref="IChatCompletionService"/> for a specific LLM provider.
///
/// The registry resolves factories by <see cref="Priority"/> (descending) and the first one
/// whose <see cref="CanHandle"/> returns <c>true</c> wins.
///
/// Convention:
///   Priority = 0  -> catch-all / default (OpenAI-compat)
///   Priority = 10 -> provider-specific override (e.g. native Anthropic SDK)
///
/// To add a new provider:
///   1. Implement this interface.
///   2. Register with <c>services.AddSingleton&lt;IChatServiceFactory, MyFactory&gt;()</c>.
///   3. Done - no other code changes required.
/// </summary>
public interface IChatServiceFactory
{
    /// <summary>
    /// Resolution priority. Higher value wins when multiple factories can handle the same provider.
    /// Default (catch-all) implementations should use 0.
    /// </summary>
    int Priority { get; }

    /// <summary>Returns <c>true</c> if this factory can build a service for the given provider ID.</summary>
    bool CanHandle(string providerId);

    /// <summary>Creates a configured <see cref="IChatCompletionService"/> ready for inference.</summary>
    /// <param name="modelId">Model identifier as stored on the AiCard (e.g. "gpt-4o-mini").</param>
    /// <param name="apiKey">Decrypted BYOK API key.</param>
    /// <param name="baseUrl">Optional endpoint override (e.g. "https://api.anthropic.com/v1").</param>
    IChatCompletionService Create(string modelId, string apiKey, string? baseUrl);
}
