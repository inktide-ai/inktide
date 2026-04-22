using System.Text.Json.Serialization;
using Chimera.API.Domain.Enums;

namespace Chimera.API.TTS.Infrastructure.Kokoro;


/// <summary>
/// Kokoro OpenAPI <c>OpenAISpeechRequest</c> JSON body (snake_case keys).
/// </summary>
public sealed class KokoroSpeechOptions
{
    
    private string _input = string.Empty;

    private KokoroSpeechVoice _voice = KokoroSpeechVoice.AfAlloy;
    
    private string _model = "kokoro";
    
    private string _responseFormat = "mp3";

    private string? _downloadFormat = "mp3";

    private double _speed = 1.0;

    private bool _stream = true;

    private bool _returnDownloadLink = false;

    private string? _langCode;

    private double? _volumeMultiplier = 1.0;

    private KokoroNormalizationOptions? _normalizationOptions;


    [JsonPropertyName("input")]
    public string Input
    {
        get => _input;
        set => _input = value;
    }

    [JsonPropertyName("voice")]
    [JsonConverter(typeof(KokoroSpeechVoiceJsonConverter))]
    public KokoroSpeechVoice Voice
    {
        get => _voice;
        set => _voice = value;
    }
    
    [JsonPropertyName("model")]
    public string Model
    {
        get => _model;
        set => _model = value;
    }

    [JsonPropertyName("response_format")]
    public string ResponseFormat
    {
        get => _responseFormat;
        set => _responseFormat = value;
    }

    [JsonPropertyName("download_format")]
    public string? DownloadFormat
    {
        get => _downloadFormat;
        set => _downloadFormat = value;
    }

    [JsonPropertyName("speed")]
    public double Speed
    {
        get => _speed;
        set => _speed = value;
    }

    [JsonPropertyName("stream")]
    public bool Stream
    {
        get => _stream;
        set => _stream = value;
    }

    [JsonPropertyName("return_download_link")]
    public bool ReturnDownloadLink
    {
        get => _returnDownloadLink;
        set => _returnDownloadLink = value;
    }

    [JsonPropertyName("lang_code")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LangCode
    {
        get => _langCode;
        set => _langCode = value;
    }

    [JsonPropertyName("volume_multiplier")]
    public double? VolumeMultiplier
    {
        get => _volumeMultiplier;
        set => _volumeMultiplier = value;
    }

    [JsonPropertyName("normalization_options")]
    public KokoroNormalizationOptions? NormalizationOptions
    {
        get => _normalizationOptions;
        set => _normalizationOptions = value;
    }

}
