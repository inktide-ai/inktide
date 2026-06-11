using System.Security.Cryptography;
using Inktide.API.Organization.Application.Entities;
using Inktide.API.Organization.Application.Enums;
using Inktide.API.Organization.Application.Exceptions;
using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Application.Options;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Organization.Application.Services;

public sealed class OrganizationInviteService : IOrganizationInviteService
{
    private readonly IOrganizationRepository _orgRepo;
    private readonly IOrganizationMemberRepository _memberRepo;
    private readonly IOrganizationInviteRepository _inviteRepo;
    private readonly IOrganizationInviteEmailService _emailService;
    private readonly IInviteAttemptTracker _attemptTracker;
    private readonly ILogger<OrganizationInviteService> _logger;
    private readonly int _expiryDays;
    private readonly TimeProvider _time;

    public OrganizationInviteService(
        IOrganizationRepository orgRepo,
        IOrganizationMemberRepository memberRepo,
        IOrganizationInviteRepository inviteRepo,
        IOrganizationInviteEmailService emailService,
        IInviteAttemptTracker attemptTracker,
        ILogger<OrganizationInviteService> logger,
        OrganizationInviteOptions options,
        TimeProvider time)
    {
        _orgRepo        = orgRepo;
        _memberRepo     = memberRepo;
        _inviteRepo     = inviteRepo;
        _emailService   = emailService;
        _attemptTracker = attemptTracker;
        _logger         = logger;
        _expiryDays     = options.ExpiryDays;
        _time           = time;
    }

    public async Task<SendInvitesResult> SendInvitesAsync(
        string requestingUserId,
        IReadOnlyList<string> emails,
        OrganizationRole role,
        CancellationToken ct = default)
    {
        var org = await GetOrCreateOrgAsync(requestingUserId, ct);
        EnsureIsOwner(requestingUserId, org);

        var utcNow = _time.GetUtcNow().UtcDateTime;
        var results = new List<InviteResult>();
        var invitesToEmail = new List<(string email, OrganizationInvite invite)>();

        var allPending   = await _inviteRepo.GetPendingByOrganizationTrackedAsync(org.Id, ct);
        var pendingByEmail = allPending.ToDictionary(i => i.Email, StringComparer.OrdinalIgnoreCase);

        foreach (var raw in emails)
        {
            var email = raw.Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(email)) continue;

            if (pendingByEmail.TryGetValue(email, out var existing))
            {
                RefreshInviteToken(existing, utcNow);
                existing.Role = role;
                invitesToEmail.Add((email, existing));
            }
            else
            {
                var invite = new OrganizationInvite
                {
                    OrganizationId = org.Id,
                    Email          = email,
                    Role           = role,
                    Token          = GenerateToken(),
                    InvitedBy      = requestingUserId,
                    Status         = InviteStatus.Pending,
                    ExpiresAt      = utcNow.AddDays(_expiryDays),
                    CreatedAt      = utcNow,
                };
                await _inviteRepo.AddAsync(invite, ct);
                invitesToEmail.Add((email, invite));
            }
        }

        await _inviteRepo.SaveChangesAsync(ct);

        foreach (var (email, invite) in invitesToEmail)
        {
            await SendEmailSafe(email, org.Name, invite.Token, ct);
            results.Add(MapToResult(invite));
        }

        return new SendInvitesResult(org.Id, results);
    }

    public async Task ResendInviteAsync(string requestingUserId, Guid inviteId, CancellationToken ct = default)
    {
        var orgId = await GetOrgIdForUserAsync(requestingUserId, ct)
            ?? throw new InviteNotFoundException();

        var pending = await _inviteRepo.GetPendingByOrganizationAsync(orgId, ct);

        var target = pending.FirstOrDefault(i => i.Id == inviteId)
            ?? throw new InviteNotFoundException();

        var org = await _orgRepo.GetByIdAsync(target.OrganizationId, ct)
            ?? throw new InviteNotFoundException();

        EnsureIsOwner(requestingUserId, org);

        RefreshInviteToken(target, _time.GetUtcNow().UtcDateTime);
        await _inviteRepo.SaveChangesAsync(ct);
        await SendEmailSafe(target.Email, org.Name, target.Token, ct);
    }

    public async Task CancelInviteAsync(string requestingUserId, Guid inviteId, CancellationToken ct = default)
    {
        var orgId = await GetOrgIdForUserAsync(requestingUserId, ct)
            ?? throw new InviteNotFoundException();

        var target = await _inviteRepo.GetPendingByIdTrackedAsync(inviteId, ct)
            ?? throw new InviteNotFoundException();

        if (target.OrganizationId != orgId)
            throw new InviteNotFoundException();

        target.Status = InviteStatus.Expired;
        await _inviteRepo.SaveChangesAsync(ct);
    }

    public async Task<AcceptInviteResult> AcceptInviteAsync(
        string token,
        string acceptingUserId,
        CancellationToken ct = default)
    {
        var utcNow = _time.GetUtcNow().UtcDateTime;
        var invite = await _inviteRepo.GetByTokenAsync(token, ct);
        if (invite is null)
        {
            // Increment only for nonexistent tokens — valid and expired invites are NOT throttled.
            // Design: abuse economics. Token entropy (384 bits) handles cryptographic protection.
            if (!await _attemptTracker.TryRecordAttemptAsync(token, acceptingUserId, ct))
                return new AcceptInviteResult(AcceptOutcome.TooManyInvalidAttempts);
            return new AcceptInviteResult(AcceptOutcome.Invalid);
        }

        if (invite.Status == InviteStatus.Accepted)
            return new AcceptInviteResult(AcceptOutcome.AlreadyMember, invite.OrganizationId);

        if (invite.ExpiresAt < utcNow)
        {
            invite.Status = InviteStatus.Expired;
            await _inviteRepo.SaveChangesAsync(ct);
            return new AcceptInviteResult(AcceptOutcome.Expired);
        }

        var org = await _orgRepo.GetByIdAsync(invite.OrganizationId, ct);
        if (org is null)
            return new AcceptInviteResult(AcceptOutcome.Invalid);

        var existingMember = await _memberRepo.GetByUserIdAsync(invite.OrganizationId, acceptingUserId, ct);
        if (existingMember is not null)
        {
            invite.Status = InviteStatus.Accepted;
            await _inviteRepo.SaveChangesAsync(ct);
            return new AcceptInviteResult(AcceptOutcome.AlreadyMember, org.Id, org.Name);
        }

        await _memberRepo.AddAsync(new OrganizationMember
        {
            OrganizationId = invite.OrganizationId,
            UserId         = acceptingUserId,
            Role           = invite.Role,
            JoinedAt       = utcNow,
        }, ct);
        invite.Status = InviteStatus.Accepted;
        // Single SaveChanges — atomically commits the new member row and the invite status update
        // because both repos share the same scoped OrganizationDbContext.
        await _memberRepo.SaveChangesAsync(ct);

        return new AcceptInviteResult(AcceptOutcome.Success, org.Id, org.Name);
    }

    public async Task<PendingInvitesResult> ListPendingAsync(string requestingUserId, CancellationToken ct = default)
    {
        var org = await _orgRepo.GetByOwnerIdAsync(requestingUserId, ct)
            ?? throw new InviteNotFoundException();

        EnsureIsOwner(requestingUserId, org);

        var invites = await _inviteRepo.GetPendingByOrganizationAsync(org.Id, ct);
        return new PendingInvitesResult(org.Id, invites.Select(MapToResult).ToList());
    }

    private static void EnsureIsOwner(string userId, Entities.Organization org)
    {
        if (org.OwnerId != userId) throw new NotAnAdminException();
    }

    private async Task<Entities.Organization> GetOrCreateOrgAsync(string ownerId, CancellationToken ct)
    {
        var org = await _orgRepo.GetByOwnerIdAsync(ownerId, ct);
        if (org is not null) return org;

        var utcNow = _time.GetUtcNow().UtcDateTime;
        org = new Entities.Organization
        {
            Name      = "Personal",
            OwnerId   = ownerId,
            CreatedAt = utcNow,
        };

        try
        {
            await _orgRepo.AddAsync(org, ct);
            await _memberRepo.AddAsync(new OrganizationMember
            {
                OrganizationId = org.Id,
                UserId         = ownerId,
                Role           = OrganizationRole.Admin,
                JoinedAt       = utcNow,
            }, ct);
            await _orgRepo.SaveChangesAsync(ct);
        }
        catch (OrganizationConcurrentCreationException)
        {
            // Another request won the race — retry the fetch to get the created org.
            org = await _orgRepo.GetByOwnerIdAsync(ownerId, ct);
            if (org is null) throw;
        }

        return org;
    }

    private async Task<Guid?> GetOrgIdForUserAsync(string userId, CancellationToken ct)
        => (await _orgRepo.GetByOwnerIdAsync(userId, ct))?.Id;

    private async Task SendEmailSafe(string email, string orgName, string token, CancellationToken ct)
    {
        try
        {
            await _emailService.SendInviteEmailAsync(email, orgName, token, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send invite email to {Email}", email);
        }
    }

    private void RefreshInviteToken(OrganizationInvite invite, DateTime utcNow)
    {
        invite.Token     = GenerateToken();
        invite.ExpiresAt = utcNow.AddDays(_expiryDays);
    }

    private static InviteResult MapToResult(OrganizationInvite i) =>
        new(i.Id, i.Email, i.Role.ToString().ToLower(), i.Status.ToString().ToLower(), i.ExpiresAt, i.CreatedAt);

    private static string GenerateToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
}
