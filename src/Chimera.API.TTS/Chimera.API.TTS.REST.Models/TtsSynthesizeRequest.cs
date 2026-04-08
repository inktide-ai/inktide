using Newtonsoft.Json;

namespace Chimera.API.TTS.REST.Models;

/// <summary>
/// Request body for <c>POST /api/tts/synthesize</c>
/// </summary>
public sealed class TtsSynthesizeRequest
{
    /// <summary>
    /// Text to synthesize.
    /// </summary>
    [JsonProperty("text")]
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Voice id for the provider (e.g. Kokoro <c>af_bella</c>).
    /// </summary>
    [JsonProperty("voice_id")]
    public string VoiceId { get; set; } = string.Empty;

    /// <summary>
    /// Optional model id (provider-specific).
    /// </summary>
    [JsonProperty("model_id")]
    public string? ModelId { get; set; }

    /// <summary>
    /// Speech speed multiplier (mapped to the provider backend when supported).
    /// </summary>
    [JsonProperty("speed")]
    public float? Speed { get; set; }

    /// <summary>
    /// Registered TTS provider id (default: <c>TtsProviders:DefaultProviderId</c>, e.g. <c>kokoro</c>).
    /// </summary>
    [JsonProperty("provider_id")]
    public string? ProviderId { get; set; }

    /// <summary>
    /// Output audio format token (<c>mp3</c>, <c>wav</c>, <c>opus</c>, …).
    /// Passed to the provider as <c>response_format</c>; also sets the response <c>Content-Type</c>.
    /// </summary>
    [JsonProperty("audio_format")]
    public string? AudioFormat { get; set; }

    /// <summary>
    /// When true, audio is streamed as generated (OpenAI/Kokoro-style); omit or false for a single buffered response.
    /// </summary>
    [JsonProperty("stream")]
    public bool? Stream { get; set; }

    /// <summary>
    /// Provider-specific parameters forwarded verbatim to <c>SpeechOptions.ProviderParams</c>.
    /// Example: <c>{ "stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": true }</c>
    /// </summary>
    [JsonProperty("provider_params")]
    public Dictionary<string, object>? ProviderParams { get; set; }
}
