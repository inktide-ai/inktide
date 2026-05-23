namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// Global catalog of available TTS voices. Managed by admins.
/// AI cards reference this via FK to select their voice.
/// </summary>
public sealed class TtsCatalogEntry
{

    private Guid _id;
    private string _provider = string.Empty;
    private string _voiceId = string.Empty;
    private string _displayName = string.Empty;
    private string _language = "en";
    private string? _gender;
    private string? _sampleUrl;
    private string _tier = "free";
    private bool _isAvailable = true;
    private DateTime _createdAt;


    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public string Provider
    {
        get => _provider;
        set => _provider = value;
    }

    public string VoiceId
    {
        get => _voiceId;
        set => _voiceId = value;
    }

    public string DisplayName
    {
        get => _displayName;
        set => _displayName = value;
    }

    public string Language
    {
        get => _language;
        set => _language = value;
    }

    public string? Gender
    {
        get => _gender;
        set => _gender = value;
    }

    public string? SampleUrl
    {
        get => _sampleUrl;
        set => _sampleUrl = value;
    }

    public string Tier
    {
        get => _tier;
        set => _tier = value;
    }

    public bool IsAvailable
    {
        get => _isAvailable;
        set => _isAvailable = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    /// <summary>True when the provider requires a BYOK API key (i.e. is not a local/free provider).</summary>
    public bool RequiresApiKey => !LocalTtsProviders.Contains(Provider);

    private static readonly HashSet<string> LocalTtsProviders =
        new(StringComparer.OrdinalIgnoreCase) { "kokoro", "piper", "coqui" };

}
