namespace Chimera.AI.Orchestrator.Application.Models;

public sealed record UserMetadata(
    string UserId,
    string UserName,
    IReadOnlyList<string> Badges,
    bool IsModerator,
    bool IsSubscriber,
    bool IsVip,
    bool IsBroadcaster,
    string? Color = null);
