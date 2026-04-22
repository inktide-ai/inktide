namespace Chimera.API.Domain.Models;

/// <summary>
/// Catalog metadata for a chat provider (UI, routing, policy). Typically built at startup from registered implementations.
/// </summary>
public sealed class ChatProviderDescriptor
{

    private string _id = string.Empty;
    private string _displayName = string.Empty;
    private ChatProviderCapabilities _capabilities = new();


    public string Id
    {
        get => _id;
        set => _id = value;
    }

    public string DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    public ChatProviderCapabilities Capabilities
    {
        get => _capabilities;
        set => _capabilities = value;
    }

}
