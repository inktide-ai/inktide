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

    /// <summary>
    /// Async variant for background pipeline consumers (no HTTP context guaranteed).
    /// Resolution order: X-TTS-Api-Key header -> per-user credential (Soul DB) -> global config -> null.
    /// Returns null when provider does not require a key or no key is configured for this user/provider.
    /// </summary>
    Task<string?> ResolveAsync(Guid? userId, string providerId, CancellationToken ct = default);

    /// <summary>
    /// Resolves the base URL override for a provider from per-user BYOK credentials.
    /// Returns null when the user has no stored credential or the credential has no base URL override.
    /// Callers should prefer <c>command.BaseUrl</c> (per-soul config) over this credential value.
    /// </summary>
    Task<string?> ResolveBaseUrlAsync(Guid? userId, string providerId, CancellationToken ct = default);

}
