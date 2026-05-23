namespace Inktide.API.Soul.Domain.Entities;

/// <summary>
/// A platform channel (Twitch/Discord/YouTube) connected to an AI card.
/// One card can be deployed to multiple channels simultaneously.
/// </summary>
public sealed class AiCardChannel
{

    private Guid _id;
    private Guid _aiCardId;
    private string _platform = "twitch";
    private string _channelName = string.Empty;
    private string? _channelId;
    private string _botUsername = string.Empty;
    private string? _oAuthTokenEnc;
    private string? _refreshTokenEnc;
    private DateTime? _tokenExpiresAt;
    private bool _isActive = true;
    private DateTime? _connectedAt;
    private DateTime _createdAt;
    private AiCard? _aiCard;


    public Guid Id
    {
        get => _id;
        set => _id = value;
    }

    public Guid AiCardId
    {
        get => _aiCardId;
        set => _aiCardId = value;
    }

    public string Platform
    {
        get => _platform;
        set => _platform = value;
    }

    public string ChannelName
    {
        get => _channelName;
        set => _channelName = value;
    }

    public string? ChannelId
    {
        get => _channelId;
        set => _channelId = value;
    }

    public string BotUsername
    {
        get => _botUsername;
        set => _botUsername = value;
    }

    /// <summary>Encrypted access token — never stored in plaintext.</summary>
    public string? OAuthTokenEnc
    {
        get => _oAuthTokenEnc;
        set => _oAuthTokenEnc = value;
    }

    /// <summary>Encrypted refresh token — never stored in plaintext.</summary>
    public string? RefreshTokenEnc
    {
        get => _refreshTokenEnc;
        set => _refreshTokenEnc = value;
    }

    private string? _customBotTokenEnc;

    /// <summary>Encrypted user-supplied bot token — never stored in plaintext.</summary>
    public string? CustomBotTokenEnc
    {
        get => _customBotTokenEnc;
        set => _customBotTokenEnc = value;
    }

    /// <summary>UTC expiry of the access token.</summary>
    public DateTime? TokenExpiresAt
    {
        get => _tokenExpiresAt;
        set => _tokenExpiresAt = value;
    }

    public bool IsActive
    {
        get => _isActive;
        set => _isActive = value;
    }

    public DateTime? ConnectedAt
    {
        get => _connectedAt;
        set => _connectedAt = value;
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => _createdAt = value;
    }

    public AiCard? AiCard
    {
        get => _aiCard;
        set => _aiCard = value;
    }

    
}
