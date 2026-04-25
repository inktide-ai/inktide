using Inktide.API.Core;
using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;
using FluentValidation.Results;

namespace Inktide.API.TTS.Domain.Speech;

/// <summary>
/// Speech (TTS) provider port. No transport types — implementations live in Infrastructure.
/// </summary>
public interface ISpeechProvider : IProvider
{

    /// <summary>
    /// Declared capabilities for catalog / UI (not runtime guarantees).
    /// </summary>
    SpeechProviderCapabilities Capabilities { get; }


    Task<SpeechModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken ct = default);

    Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default);

    Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default);

}
