using Inktide.API.Developer.Application.Interfaces;
using Inktide.API.Developer.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Developer.REST.Controllers;

[ApiController]
[Route("api/oauth")]
public sealed class OAuthConsentController(IDeveloperAppService appService) : ControllerBase
{
    /// <summary>
    /// Returns app info for the OAuth consent screen.
    /// Does NOT require authorization (user may not be logged in yet).
    /// </summary>
    [HttpGet("app-info")]
    [AllowAnonymous]
    [ProducesResponseType<AppInfoDto>(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetAppInfo(
        [FromQuery] string client_id,
        [FromQuery] string? scope,
        [FromQuery] string redirect_uri,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(client_id) || string.IsNullOrWhiteSpace(redirect_uri))
            return BadRequest(new { error = "invalid_request", error_description = "client_id and redirect_uri are required." });

        var info = await appService.GetAppInfoAsync(client_id, scope, redirect_uri, ct);
        if (info is null)
            return NotFound(new { error = "invalid_client", error_description = "Unknown client_id or redirect_uri not whitelisted." });

        return Ok(info);
    }
}
