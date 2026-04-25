namespace Inktide.API.Domain.Models;

public sealed class TokenUsage
{

    private int _promptTokens;
    private int _completionTokens;


    public int PromptTokens
    {
        get => _promptTokens;
        set => _promptTokens = value;
    }

    public int CompletionTokens
    {
        get => _completionTokens;
        set => _completionTokens = value;
    }

}
