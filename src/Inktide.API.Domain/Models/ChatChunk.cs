namespace Inktide.API.Domain.Models;

public sealed class ChatChunk
{

    private string _delta = string.Empty;
    private bool _isFinished;


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

}
