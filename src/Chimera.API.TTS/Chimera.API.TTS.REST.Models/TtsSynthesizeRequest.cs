using Newtonsoft.Json;

namespace Chimera.API.TTS.REST.Models;

/// <summary>
/// Request body for <c>POST /api/tts/synthesize</c> 
/// </summary>
public sealed class TtsSynthesizeRequest
{
    #region Fields

    private string _text = string.Empty;
    private string _voiceId = string.Empty;
    private string? _modelId;
    private float? _speed;
    private string? _providerId;
    private string? _audioFormat;
    private bool? _stream;

    #endregion

    #region Properties

    /// <summary>
    /// Text to synthesize.
    /// </summary>
    [JsonProperty("text")]
    public string Text
    {
        get => _text;
        set => _text = value;
    }

    /// <summary>
    /// Voice id for the provider (e.g. Kokoro <c>af_bella</c>).
    /// </summary>
    [JsonProperty("voice_id")]
    public string VoiceId
    {
        get => _voiceId;
        set => _voiceId = value;
    }

    /// <summary>
    /// Optional model id (provider-specific).
    /// </summary>
    [JsonProperty("model_id")]
    public string? ModelId
    {
        get => _modelId;
        set => _modelId = value;
    }

    /// <summary>
    /// Speech speed multiplier (mapped to the provider backend when supported).
    /// </summary>
    [JsonProperty("speed")]
    public float? Speed
    {
        get => _speed;
        set => _speed = value;
    }

    /// <summary>
    /// Registered TTS provider id (default: <c>TtsProviders:DefaultProviderId</c>, e.g. <c>kokoro</c>).
    /// </summary>
    [JsonProperty("provider_id")]
    public string? ProviderId
    {
        get => _providerId;
        set => _providerId = value;
    }

    /// <summary>
    /// Output audio format (canonical id: <c>mp3</c>, <c>wav</c>, <c>opus</c>, …). Same token is passed to Kokoro <c>response_format</c> / <c>download_format</c> when supported.
    /// </summary>
    [JsonProperty("audio_format")]
    public string? AudioFormat
    {
        get => _audioFormat;
        set => _audioFormat = value;
    }

    /// <summary>
    /// When true, audio is streamed as generated (OpenAI/Kokoro-style); omit or false for a single buffered response.
    /// </summary>
    [JsonProperty("stream")]
    public bool? Stream
    {
        get => _stream;
        set => _stream = value;
    }

    #endregion
}
