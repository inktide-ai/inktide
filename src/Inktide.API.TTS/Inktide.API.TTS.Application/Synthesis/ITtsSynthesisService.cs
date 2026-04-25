using Inktide.API.TTS.Domain.Models;

namespace Inktide.API.TTS.Application.Synthesis;

/// <summary>
/// Application use case: orchestrates TTS synthesis (provider resolution, credentials, validation, streaming rules, provider call).
/// </summary>
public interface ITtsSynthesisService
{

    Task<SpeechResult> SynthesizeAsync(
        SynthesizeCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lists available voices for a provider. Returns <see cref="GetVoicesResult.NotSupported"/>
    /// if the provider does not expose voice listing.
    /// </summary>
    Task<GetVoicesResult> GetVoicesAsync(string? providerId, CancellationToken ct = default);

    /// <summary>
    /// Returns the catalog of registered TTS providers, sorted by id.
    /// </summary>
    IReadOnlyCollection<SpeechProviderDescriptor> GetProviderCatalog();

}
