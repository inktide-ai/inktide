namespace Chimera.API.Domain.Models;

public sealed class TokenUsage
{
    #region Fields

    private int _promptTokens;
    private int _completionTokens;

    #endregion

    #region Properties

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

    #endregion
}
