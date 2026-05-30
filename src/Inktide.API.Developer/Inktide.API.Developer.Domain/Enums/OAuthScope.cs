namespace Inktide.API.Developer.Domain.Enums;

public enum OAuthScope
{
    ChannelsRead,     // GET /api/soul/*/channels
    ChannelsWrite,    // POST/DELETE /api/soul/*/channels
    MessagesReceive,  // webhook event: message.received
    SoulRead,         // GET /api/soul/cards (public fields only)
}

public static class OAuthScopeDescriptions
{
    public static readonly IReadOnlyDictionary<OAuthScope, string> Descriptions =
        new Dictionary<OAuthScope, string>
        {
            [OAuthScope.ChannelsRead]    = "Read your channels list",
            [OAuthScope.ChannelsWrite]   = "Connect and disconnect channels",
            [OAuthScope.MessagesReceive] = "Receive notifications about incoming messages",
            [OAuthScope.SoulRead]        = "Read public information about your Soul cards",
        };

    public static string? FromString(string value) => value switch
    {
        "channels:read"    => nameof(OAuthScope.ChannelsRead),
        "channels:write"   => nameof(OAuthScope.ChannelsWrite),
        "messages:receive" => nameof(OAuthScope.MessagesReceive),
        "soul:read"        => nameof(OAuthScope.SoulRead),
        _                  => null,
    };

    public static string ToScopeString(OAuthScope scope) => scope switch
    {
        OAuthScope.ChannelsRead    => "channels:read",
        OAuthScope.ChannelsWrite   => "channels:write",
        OAuthScope.MessagesReceive => "messages:receive",
        OAuthScope.SoulRead        => "soul:read",
        _                          => scope.ToString().ToLowerInvariant(),
    };
}
