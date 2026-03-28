namespace Chimera.API.Connector.Application.Models;

/// <summary>Sender info from the chat message: username, badges and roles.</summary>
public sealed record UserMetadata(
    string UserId,
    string UserName,
    IReadOnlyList<string> Badges,
    bool IsModerator,
    bool IsSubscriber,
    bool IsVip,
    bool IsBroadcaster,
    string? Color = null);
