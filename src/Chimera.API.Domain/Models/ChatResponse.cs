namespace Chimera.API.Domain.Models;

public sealed class ChatResponse
{
    #region Fields

    private string _text = string.Empty;
    private string _model = string.Empty;
    private TokenUsage? _usage;

    #endregion

    #region Properties

    public string Text
    {
        get => _text;
        set => _text = value;
    }

    public string Model
    {
        get => _model;
        set => _model = value;
    }

    public TokenUsage? Usage
    {
        get => _usage;
        set => _usage = value;
    }

    #endregion
}
