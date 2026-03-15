using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Chimera.API.Identify.REST.Models;

namespace Chimera.API.Identify.REST.Controllers;

/// <summary>Current-user endpoint. Requires a valid JWT.</summary>
[ApiController]
[Route("api/me")]
[Authorize]
[Produces("application/json")]
public sealed class MeController : ControllerBase
{
    /// <summary>Returns current user info from JWT claims.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public IActionResult Get()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(sub))
        {
            return Unauthorized(ApiErrorResponse.From(
                "Token is missing required identity claims.",
                ErrorCodes.Unauthorized));
        }

        var name = User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("unique_name")?.Value
            ?? sub;

        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "user";

        return Ok(new MeResponse(sub, name, role));
    }
}
