using Inktide.API.TTS.Domain.Exceptions;
using Inktide.API.TTS.Domain.Speech;

namespace Inktide.API.TTS.Application.Abstractions;

/// <summary>
/// Application port: resolves optional API keys for TTS providers (implemented in Infrastructure).
/// </summary>
public interface IApiKeyResolver
{

    /// <summary>
    /// Returns <see langword="null"/> when the provider does not require an API key.
    /// Otherwise returns the resolved key, or throws <see cref="ApiKeyMissingException"/> when a key is required but missing.
    /// </summary>
    /// <param name="providerId">Registered <see cref="ISpeechProvider"/> id.</param>
    string? Resolve(string providerId);

    /// <summary>
    /// Returns <see langword="true"/> when the last resolved key for <paramref name="providerId"/>
    /// came from a per-request header (BYOK). Infrastructure clients must not cache such clients.
    /// </summary>
    bool IsHeaderKey(string providerId);

}
