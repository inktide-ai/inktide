namespace Inktide.API.TTS.Domain.Models;

/// <summary>
/// Catalog metadata for a speech (TTS) provider.
/// </summary>
public sealed class SpeechProviderDescriptor
{

    private string _id = string.Empty;
    private string _displayName = string.Empty;
    private SpeechProviderCapabilities _capabilities = new();


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

    public SpeechProviderCapabilities Capabilities
    {
        get => _capabilities;
        set => _capabilities = value;
    }

}
