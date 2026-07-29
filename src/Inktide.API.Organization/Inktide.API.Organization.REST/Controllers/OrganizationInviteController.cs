using System.Security.Claims;
using Inktide.API.Organization.Application.Enums;
using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Organization.REST.Controllers;

[ApiController]
[Route("api/v1/organization/invites")]
[Produces("application/json")]
[Authorize]
public sealed class OrganizationInviteController : ControllerBase
{
    private readonly IOrganizationInviteService _service;

    public OrganizationInviteController(IOrganizationInviteService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PendingInvitesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListPending(CancellationToken ct)
    {
        var result = await _service.ListPendingAsync(GetUserId(), ct);
        return Ok(new PendingInvitesResponse
        {
            OrganizationId = result.OrganizationId,
            Invites = result.Invites.Select(MapDto).ToList(),
        });
    }

    [HttpPost]
    [ProducesResponseType(typeof(SendInvitesResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SendInvites([FromBody] SendInvitesRequest dto, CancellationToken ct)
    {
        // Role is validated by SendInvitesRequestValidator - TryParse is guaranteed to succeed here.
        Enum.TryParse<OrganizationRole>(dto.Role, ignoreCase: true, out var role);
        var result = await _service.SendInvitesAsync(GetUserId(), dto.Emails, role, ct);
        return StatusCode(StatusCodes.Status201Created, new SendInvitesResponse
        {
            OrganizationId = result.OrganizationId,
            Invites = result.Invites.Select(MapDto).ToList(),
        });
    }

    [HttpPost("{inviteId:guid}/deliveries")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResendInvite(Guid inviteId, CancellationToken ct)
    {
        await _service.ResendInviteAsync(GetUserId(), inviteId, ct);
        return NoContent();
    }

    [HttpDelete("{inviteId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelInvite(Guid inviteId, CancellationToken ct)
    {
        await _service.CancelInviteAsync(GetUserId(), inviteId, ct);
        return NoContent();
    }

    [HttpPost("accept")]
    [ProducesResponseType(typeof(AcceptInviteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AcceptInvite([FromBody] AcceptInviteRequest dto, CancellationToken ct)
    {
        var result = await _service.AcceptInviteAsync(dto.Token, GetUserId(), ct);

        if (result.Outcome == AcceptOutcome.TooManyInvalidAttempts)
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { error = "Too many attempts for this token.", code = "TOO_MANY_INVALID_ATTEMPTS" });

        return Ok(new AcceptInviteResponse
        {
            Result           = MapOutcome(result.Outcome),
            OrganizationId   = result.OrganizationId,
            OrganizationName = result.OrganizationName,
        });
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("User identity not found in token.");

    private static InviteDto MapDto(InviteResult r) =>
        new()
        {
            Id        = r.Id,
            Email     = r.Email,
            Role      = r.Role,
            Status    = r.Status,
            ExpiresAt = r.ExpiresAt,
            CreatedAt = r.CreatedAt,
        };

    private static string MapOutcome(AcceptOutcome outcome) => outcome switch
    {
        AcceptOutcome.Success                => "success",
        AcceptOutcome.AlreadyMember          => "already_member",
        AcceptOutcome.Expired                => "expired",
        AcceptOutcome.Invalid                => "invalid",
        AcceptOutcome.TooManyInvalidAttempts => "too_many_invalid_attempts",
        _                                    => "invalid",
    };
}
