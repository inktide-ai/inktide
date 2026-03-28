using Chimera.API.Domain.Enums;

namespace Chimera.API.Domain.Models;

public sealed class ChatRequest
{
    #region Fields

    private string _model = string.Empty;
    private List<ChatMessage> _messages = [];
    private float? _temperature;
    private int? _maxTokens;
    private bool _stream;

    #endregion

    #region Properties

    public string Model
    {
        get => _model;
        set => _model = value;
    }

    public List<ChatMessage> Messages
    {
        get => _messages;
        set => _messages = value;
    }

    public float? Temperature
    {
        get => _temperature;
        set => _temperature = value;
    }

    public int? MaxTokens
    {
        get => _maxTokens;
        set => _maxTokens = value;
    }

    public bool Stream
    {
        get => _stream;
        set => _stream = value;
    }

    #endregion
}
