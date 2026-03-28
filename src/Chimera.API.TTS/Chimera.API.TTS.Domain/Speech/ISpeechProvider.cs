using Chimera.API.Core;
using Chimera.API.Domain.Models;
using Chimera.API.TTS.Domain.Models;
using FluentValidation.Results;

namespace Chimera.API.TTS.Domain.Speech;

/// <summary>
/// Speech (TTS) provider port. No transport types — implementations live in Infrastructure.
/// </summary>
public interface ISpeechProvider : IProvider
{
    #region Properties

    /// <summary>
    /// Declared capabilities for catalog / UI (not runtime guarantees).
    /// </summary>
    SpeechProviderCapabilities Capabilities { get; }

    #endregion

    #region Methods

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

    #endregion
}
