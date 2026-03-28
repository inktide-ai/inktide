namespace Chimera.API.Domain.Models;

public sealed class ChatChunk
{
    #region Fields

    private string _delta = string.Empty;
    private bool _isFinished;

    #endregion

    #region Properties

    public string Delta
    {
        get => _delta;
        set => _delta = value;
    }

    public bool IsFinished
    {
        get => _isFinished;
        set => _isFinished = value;
    }

    #endregion
}
