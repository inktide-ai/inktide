namespace Inktide.API.TTS.Application.Synthesis;

/// <summary>
/// Outcome of a TTS synthesis attempt (no HTTP types).
/// </summary>
public abstract record SpeechResult
{

    public sealed record Ok(Stream Audio, string ContentType) : SpeechResult;

    public sealed record ProviderNotFound(string ProviderId) : SpeechResult;

    public sealed record ValidationFailed(IReadOnlyList<SpeechValidationError> Errors) : SpeechResult;

    public sealed record StreamingNotSupported(string ProviderId) : SpeechResult;

    /// <summary>
    /// Upstream provider returned an error. The <see cref="Message"/> is safe to log but
    /// must NOT be forwarded to clients - it may contain internal service details.
    /// </summary>
    public sealed record UpstreamError(string Message) : SpeechResult;

    /// <summary>
    /// Provider requires an API key but none was supplied or found in configuration.
    /// </summary>
    public sealed record ApiKeyMissing(string ProviderId) : SpeechResult;

}
