using System.Security.Claims;
using Inktide.API.Core;
using Inktide.API.Profile.Application.Entities;
using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.REST.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Inktide.API.Profile.REST.Controllers;

/// <summary>
/// Current user identity and account lifecycle (session validation, data purge, Keycloak delete).
/// </summary>
[ApiController]
[Route("api/v1/me")]
[Produces("application/json")]
[Authorize]
public sealed class MeController : ControllerBase
{
    private static readonly JsonSerializerOptions _camelCase = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly IUserAccountDeletionService _accountDeletion;
    private readonly IUserAvatarService _avatar;
    private readonly IUserPreferencesService _preferences;


    public MeController(IUserAccountDeletionService accountDeletion, IUserAvatarService avatar, IUserPreferencesService preferences)
    {
        _accountDeletion = accountDeletion ?? throw new ArgumentNullException(nameof(accountDeletion));
        _avatar = avatar ?? throw new ArgumentNullException(nameof(avatar));
        _preferences = preferences ?? throw new ArgumentNullException(nameof(preferences));
    }


    [HttpGet]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null)
            return Unauthorized();

        var userName = User.FindFirstValue("preferred_username")
            ?? User.FindFirstValue(ClaimTypes.Name)
            ?? sub;

        var role = User.FindFirstValue(ClaimTypes.Role) ?? "user";
        var avatarUrl = await _avatar.GetAvatarUrlAsync(sub, ct).ConfigureAwait(false);

        return Ok(new MeResponse
        {
            UserId = sub,
            UserName = userName,
            Role = role,
            PictureUrl = avatarUrl
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
            return BadRequest(ApiErrorResponse.From("objectKey is required.", "VALIDATION_ERROR"));

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


    [HttpGet("preferences")]
    [ProducesResponseType(typeof(GlobalPreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetGlobalPreferences(CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null) return Unauthorized();

        var result = await _preferences.GetGlobalAsync(sub, ct).ConfigureAwait(false);
        return Ok(ToGlobalResponse(result));
    }

    [HttpPatch("preferences")]
    [ProducesResponseType(typeof(GlobalPreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PatchGlobalPreferences([FromBody] PatchGlobalPreferencesRequest body, CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null) return Unauthorized();

        var appearance    = GlobalPreferencesMapper.ToAppearancePrefs(body.Appearance);
        var notifications = GlobalPreferencesMapper.ToNotifPrefs(body.Notifications);

        var result = await _preferences.PatchGlobalAsync(sub, appearance, body.Language, notifications, body.Favorites, ct).ConfigureAwait(false);
        return Ok(ToGlobalResponse(result));
    }

    [HttpGet("preferences/workspace/{characterId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWorkspacePreferences(string characterId, CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null) return Unauthorized();

        var result = await _preferences.GetWorkspaceAsync(sub, characterId, ct).ConfigureAwait(false);
        return WorkspaceJson(result);
    }

    [HttpPatch("preferences/workspace/{characterId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PatchWorkspacePreferences(string characterId, [FromBody] PatchWorkspacePreferencesRequest body, CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub is null) return Unauthorized();

        var hubLayout     = body.HubLayout?.ToString(Newtonsoft.Json.Formatting.None);
        var sceneSettings = body.SceneSettings is null ? null : JsonSerializer.Serialize(body.SceneSettings, _camelCase);

        var result = await _preferences.PatchWorkspaceAsync(sub, characterId, hubLayout, sceneSettings, ct).ConfigureAwait(false);
        return WorkspaceJson(result);
    }

    // Raw JSON strings from the DB are valid JSON - embed them directly to avoid
    // Newtonsoft circular-reference issues with System.Text.Json.Nodes.JsonNode.
    private static ContentResult WorkspaceJson(UserPreferencesWorkspace w) => new()
    {
        Content     = $$"""{"hubLayout":{{w.HubLayout ?? "null"}},"sceneSettings":{{w.SceneSettings ?? "null"}}}""",
        ContentType = "application/json",
        StatusCode  = 200,
    };

    private static GlobalPreferencesResponse ToGlobalResponse(UserPreferencesGlobal g) => new()
    {
        Appearance = new AppearancePrefDto
        {
            Theme = g.Appearance.Theme,
            AccentColor = g.Appearance.AccentColor,
            FontSize = g.Appearance.FontSize,
            Compact = g.Appearance.Compact,
            ReduceMotion = g.Appearance.ReduceMotion,
        },
        Language = g.Language,
        Notifications = new NotifPrefDto
        {
            Enabled = g.Notifications.Enabled,
            EmailMentions = g.Notifications.EmailMentions,
            EmailMessages = g.Notifications.EmailMessages,
            EmailProjectUpdates = g.Notifications.EmailProjectUpdates,
            EmailSystem = g.Notifications.EmailSystem,
            PushMentions = g.Notifications.PushMentions,
            PushMessages = g.Notifications.PushMessages,
            PushReminders = g.Notifications.PushReminders,
        },
        Favorites = g.Favorites,
    };


    public sealed class GlobalPreferencesResponse
    {
        public AppearancePrefDto Appearance { get; init; } = new();
        public string Language { get; init; } = "en";
        public NotifPrefDto Notifications { get; init; } = new();
        public string[] Favorites { get; init; } = [];
    }

    public sealed class PatchGlobalPreferencesRequest
    {
        public AppearancePrefDto? Appearance { get; init; }
        public string? Language { get; init; }
        public NotifPrefDto? Notifications { get; init; }
        public string[]? Favorites { get; init; }
    }

    public sealed class PatchWorkspacePreferencesRequest
    {
        public Newtonsoft.Json.Linq.JToken? HubLayout { get; init; }
        public SceneSettingsDto? SceneSettings { get; init; }
    }

    public sealed class AppearancePrefDto
    {
        public string? Theme { get; init; }
        public string? AccentColor { get; init; }
        public string? FontSize { get; init; }
        public bool? Compact { get; init; }
        public bool? ReduceMotion { get; init; }
    }

    public sealed class NotifPrefDto
    {
        public bool? Enabled { get; init; }
        public bool? EmailMentions { get; init; }
        public bool? EmailMessages { get; init; }
        public bool? EmailProjectUpdates { get; init; }
        public bool? EmailSystem { get; init; }
        public bool? PushMentions { get; init; }
        public bool? PushMessages { get; init; }
        public bool? PushReminders { get; init; }
    }

    public sealed class SceneSettingsDto
    {
        public ModelPositionDto?      Position         { get; init; }
        public CameraSettingsDto?     Camera           { get; init; }
        public AnimationsSettingsDto? Animations       { get; init; }
        public BreastPhysicsDto?      BreastPhysics    { get; init; }
        public DirectionalLightDto?   DirectionalLight { get; init; }
        public AmbientLightDto?       AmbientLight     { get; init; }
    }

    public sealed record ModelPositionDto(float PosX, float PosY, float PosZ, float RotY);
    public sealed record CameraSettingsDto(float Fov, float CameraDistance, float RenderScale, string LookAtMode);
    public sealed record AnimationsSettingsDto(bool RandomAnimationsEnabled);
    public sealed record BreastPhysicsDto(bool JiggleEnabled, float JiggleMult);
    public sealed record DirectionalLightDto(float Intensity, string Color, float RotX, float RotY);
    public sealed record AmbientLightDto(float Intensity, string Color);

}
