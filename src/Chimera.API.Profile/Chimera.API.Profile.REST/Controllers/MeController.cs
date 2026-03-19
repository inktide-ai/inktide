using System.Security.Claims;
using Chimera.API.Profile.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Chimera.API.Profile.REST.Controllers;

/// <summary>
/// Current user identity and account lifecycle (session validation, data purge, Keycloak delete).
/// </summary>
[ApiController]
[Route("api/me")]
[Produces("application/json")]
[Authorize]
public sealed class MeController : ControllerBase
{
    #region Fields

    private readonly IUserAccountDeletionService _accountDeletion;
    private readonly IUserAvatarService _avatar;

    #endregion

    #region Constructors

    public MeController(IUserAccountDeletionService accountDeletion, IUserAvatarService avatar)
    {
        _accountDeletion = accountDeletion ?? throw new ArgumentNullException(nameof(accountDeletion));
        _avatar = avatar ?? throw new ArgumentNullException(nameof(avatar));
    }

    #endregion

    #region Public Methods

    [HttpGet]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetMe()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null)
            return Unauthorized();

        var userName = User.FindFirstValue("preferred_username")
            ?? User.FindFirstValue(ClaimTypes.Name)
            ?? sub;

        var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";
        var picture =
            User.FindFirstValue("picture")
            ?? User.FindFirstValue("Picture");

        return Ok(new MeResponse
        {
            UserId = sub,
            UserName = userName,
            Role = role,
            PictureUrl = string.IsNullOrWhiteSpace(picture) ? null : picture
        });
    }

    /// <summary>
    /// Points Keycloak user attribute <c>picture</c> to the public URL of an object uploaded via <c>POST /api/storage/upload</c>.
    /// </summary>
    [HttpPatch("avatar")]
    [ProducesResponseType(typeof(PatchAvatarResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> PatchAvatar([FromBody] PatchAvatarRequest body, CancellationToken ct)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.ObjectKey))
            return BadRequest(new { message = "objectKey is required." });

        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null || !Guid.TryParse(sub, out var userId))
            return Unauthorized();

        var result = await _avatar
            .SetAvatarFromObjectKeyAsync(userId, body.ObjectKey.Trim(), ct)
            .ConfigureAwait(false);

        if (!result.Success)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = result.Error });

        return Ok(new PatchAvatarResponse { PictureUrl = result.PictureUrl });
    }

    /// <summary>
    /// Deletes all Soul data for the current user, then removes the Keycloak user when Admin API is configured.
    /// </summary>
    [HttpDelete]
    [ProducesResponseType(typeof(DeleteMeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteMe(CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null || !Guid.TryParse(sub, out var userId))
            return Unauthorized();

        var result = await _accountDeletion.DeleteAllDataForUserAsync(userId, ct).ConfigureAwait(false);

        return Ok(new DeleteMeResponse
        {
            DatabasePurged = result.DatabasePurged,
            IdentityRemovedFromKeycloak = result.IdentityRemovedFromKeycloak,
            KeycloakAdminSkipped = result.KeycloakAdminSkipped,
            Warning = result.Warning
        });
    }

    #endregion

    #region Nested Types

    public sealed class MeResponse
    {
        public string UserId { get; init; } = string.Empty;
        public string UserName { get; init; } = string.Empty;
        public string Role { get; init; } = string.Empty;
        /// <summary>Profile image URL when Keycloak maps user attribute <c>picture</c> into the access token.</summary>
        public string? PictureUrl { get; init; }
    }

    public sealed class PatchAvatarRequest
    {
        public string ObjectKey { get; init; } = string.Empty;
    }

    public sealed class PatchAvatarResponse
    {
        public string? PictureUrl { get; init; }
    }

    public sealed class DeleteMeResponse
    {
        public bool DatabasePurged { get; init; }
        public bool IdentityRemovedFromKeycloak { get; init; }
        public bool KeycloakAdminSkipped { get; init; }
        public string? Warning { get; init; }
    }

    #endregion
}
