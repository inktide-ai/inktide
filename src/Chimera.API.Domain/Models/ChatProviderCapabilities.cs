namespace Chimera.API.Domain.Models;

/// <summary>
/// Declared capabilities of a chat model provider (for catalog / routing). Not runtime guarantees.
/// </summary>
public sealed class ChatProviderCapabilities
{

    private bool _supportsStreaming;
    private bool _supportsTools;
    private int? _maxContextTokens;


    public bool SupportsStreaming
    {
        get => _supportsStreaming;
        set => _supportsStreaming = value;
    }

    public bool SupportsTools
    {
        get => _supportsTools;
        set => _supportsTools = value;
    }

    /// <summary>
    /// Maximum context window in tokens when known; otherwise null.
    /// </summary>
    public int? MaxContextTokens
    {
        get => _maxContextTokens;
        set => _maxContextTokens = value;
    }

}
