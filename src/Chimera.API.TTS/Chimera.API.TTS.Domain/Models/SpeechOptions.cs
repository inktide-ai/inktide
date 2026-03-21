namespace Chimera.API.TTS.Domain.Models;

public sealed class SpeechOptions
{
    #region Fields

    private string _text = string.Empty;
    private string _voice = string.Empty;
    
    private string? _model;
    private string _audioFormat = SpeechAudioFormatCatalog.DefaultFormatId;
    private float _speed = 1.0f;
    private float _pitch = 1.0f;
    private bool _stream;

    #endregion

    #region Properties

    public string Text
    {
        get => _text;
        set => _text = value;
    }
    
    

    public string Voice
    {
        get => _voice;
        set => _voice = value;
    }

    public string? Model
    {
        get => _model;
        set => _model = value;
    }

    /// <summary>
    /// Canonical output format id (see <see cref="SpeechAudioFormatCatalog"/>), e.g. <c>mp3</c>, <c>wav</c>.
    /// </summary>
    public string AudioFormat
    {
        get => _audioFormat;
        set => _audioFormat = value;
    }

    public float Speed
    {
        get => _speed;
        set => _speed = value;
    }

    public float Pitch
    {
        get => _pitch;
        set => _pitch = value;
    }

    /// <summary>
    /// When true, the backend may emit audio incrementally (e.g. Kokoro <c>stream: true</c>); the HTTP response is forwarded without buffering the full body first.
    /// </summary>
    public bool Stream
    {
        get => _stream;
        set => _stream = value;
    }

    #endregion
}
