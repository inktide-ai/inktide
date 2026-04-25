using Inktide.API.TTS.Domain.Models;

namespace Inktide.API.TTS.Application.Synthesis;

/// <summary>
/// Result of a voice listing request. Discriminated union — match all cases.
/// </summary>
public abstract record GetVoicesResult
{
    public sealed record Ok(SpeechVoiceCollection Voices) : GetVoicesResult;
    public sealed record ProviderNotFound(string ProviderId) : GetVoicesResult;
    public sealed record NotSupported(string ProviderId) : GetVoicesResult;
    /// <summary>Provider requires an API key — supply it via <c>X-TTS-Api-Key</c> header.</summary>
    public sealed record ApiKeyRequired(string ProviderId) : GetVoicesResult;
}
