using Chimera.API.TTS.Domain.Exceptions;
using Chimera.API.TTS.Domain.Speech;

namespace Chimera.API.TTS.Application.Abstractions;

/// <summary>
/// Application port: resolves optional API keys for TTS providers (implemented in Infrastructure).
/// </summary>
public interface IApiKeyResolver
{
    #region Methods

    /// <summary>
    /// Returns <see langword="null"/> when the provider does not require an API key.
    /// Otherwise returns the resolved key, or throws <see cref="ApiKeyMissingException"/> when a key is required but missing.
    /// </summary>
    /// <param name="providerId">Registered <see cref="ISpeechProvider"/> id.</param>
    string? Resolve(string providerId);

    #endregion
}
