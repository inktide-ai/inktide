using Chimera.API.Domain.Enums;

namespace Chimera.API.Domain.Models;

public sealed class ChatMessage
{
    #region Fields

    private ChatRole _role;
    private string _content = string.Empty;

    #endregion

    #region Properties

    public ChatRole Role
    {
        get => _role;
        set => _role = value;
    }

    public string Content
    {
        get => _content;
        set => _content = value;
    }

    #endregion
}
