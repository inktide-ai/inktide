using Inktide.API.Domain.Models;
using Inktide.API.TTS.Domain.Models;

namespace Inktide.API.TTS.Domain.Speech;

/// <summary>
/// Opt-in interface for providers that can enumerate available voices.
/// Implemented alongside <see cref="ISpeechProvider"/> on providers where
/// <see cref="SpeechProviderCapabilities.SupportsVoiceListing"/> is <see langword="true"/>.
/// </summary>
public interface IVoiceListingProvider
{
    Task<SpeechVoiceCollection> GetVoicesAsync(
        ProviderOptions options,
        string? modelId = null,
        CancellationToken ct = default);
}
