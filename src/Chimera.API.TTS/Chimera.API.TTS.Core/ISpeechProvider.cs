using Chimera.API.Core;
using Chimera.API.Domain.Models;
using Chimera.API.TTS.Domain.Models;
using FluentValidation.Results;

namespace Chimera.API.TTS.Core;

/// <summary>
/// Speech (TTS) provider contract. No HTTP types — transport lives in Infrastructure.
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

    Task<TtsModelCollection> GetModelsAsync(
        ProviderOptions options,
        CancellationToken ct = default);

    Task<TtsVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default);

    Task<Stream> SynthesizeAsync(
        ProviderOptions providerOptions,
        SpeechOptions speechOptions,
        CancellationToken ct = default);

    #endregion
    
}
