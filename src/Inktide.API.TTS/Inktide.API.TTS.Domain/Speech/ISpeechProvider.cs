using Inktide.API.Core;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;

namespace Inktide.API.TTS.Domain.Speech;

/// <summary>
/// Speech (TTS) provider port. No transport types - implementations live in Infrastructure.
/// Optional listing operations are split into <see cref="IVoiceListingProvider"/> and
/// <see cref="IModelListingProvider"/> - only implemented by providers that support them.
/// </summary>
public interface ISpeechProvider : IProvider
{

    /// <summary>
    /// Declared capabilities for catalog / UI (not runtime guarantees).
    /// Use <see cref="IVoiceListingProvider"/> and <see cref="IModelListingProvider"/> for
    /// optional listing operations.
    /// </summary>
    SpeechProviderCapabilities Capabilities { get; }

    Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default);

}
