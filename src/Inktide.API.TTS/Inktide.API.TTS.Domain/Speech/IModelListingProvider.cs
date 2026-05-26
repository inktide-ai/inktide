using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;

namespace Inktide.API.TTS.Domain.Speech;

/// <summary>
/// Opt-in interface for providers that can enumerate available models.
/// Implemented alongside <see cref="ISpeechProvider"/> on providers where live or
/// static model data is available.
/// </summary>
public interface IModelListingProvider
{
    Task<SpeechModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken ct = default);
}
