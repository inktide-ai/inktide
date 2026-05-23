using Inktide.API.Organization.Application.Enums;

namespace Inktide.API.Organization.Application.Interfaces;

public record InviteResult(
    Guid Id,
    string Email,
    string Role,
    string Status,
    DateTime ExpiresAt,
    DateTime CreatedAt);

public record SendInvitesResult(Guid OrganizationId, IReadOnlyList<InviteResult> Invites);

public record PendingInvitesResult(Guid OrganizationId, IReadOnlyList<InviteResult> Invites);

public enum AcceptOutcome
{
    Success,
    AlreadyMember,
    Expired,
    Invalid,
    /// <summary>
    /// Triggered only on nonexistent token lookups.
    /// Valid and expired tokens never increment this counter.
    /// </summary>
    TooManyInvalidAttempts,
}

public record AcceptInviteResult(AcceptOutcome Outcome, Guid? OrganizationId = null, string? OrganizationName = null);

public interface IOrganizationInviteService
{
    Task<SendInvitesResult> SendInvitesAsync(
        string requestingUserId,
        IReadOnlyList<string> emails,
        OrganizationRole role,
        CancellationToken ct = default);

    Task ResendInviteAsync(string requestingUserId, Guid inviteId, CancellationToken ct = default);
    Task CancelInviteAsync(string requestingUserId, Guid inviteId, CancellationToken ct = default);
    Task<AcceptInviteResult> AcceptInviteAsync(string token, string acceptingUserId, CancellationToken ct = default);
    Task<PendingInvitesResult> ListPendingAsync(string requestingUserId, CancellationToken ct = default);
}
