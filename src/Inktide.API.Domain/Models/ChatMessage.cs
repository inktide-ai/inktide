using Inktide.API.Domain.Enums;

namespace Inktide.API.Domain.Models;

public sealed class ChatMessage
{

    private ChatRole _role;
    private string _content = string.Empty;


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

}
