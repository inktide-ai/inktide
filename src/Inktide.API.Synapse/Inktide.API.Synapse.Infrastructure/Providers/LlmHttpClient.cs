namespace Inktide.API.Synapse.Infrastructure.Providers;

/// <summary>
/// Named <see cref="HttpClient"/> for LLM provider calls. Left to itself, the OpenAI SDK builds its
/// own client with online certificate revocation checking, which on macOS fails against CRL-only
/// certificates (Let's Encrypt dropped OCSP in 2025) with RevocationStatusUnknown. A client from
/// IHttpClientFactory uses the platform defaults like every other outbound call in the app.
/// </summary>
internal static class LlmHttpClient
{
    public const string Name = "llm";
}
