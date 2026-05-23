using System.Security.Claims;
using Inktide.API.Marketplace.Application.Interfaces;
using Inktide.API.Marketplace.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Marketplace.REST.Controllers;

[ApiController]
[Route("api/marketplace")]
[Produces("application/json")]
public sealed class MarketplaceController(IMarketplaceService svc) : ControllerBase
{
    [HttpGet("connectors")]
    [ProducesResponseType(typeof(IReadOnlyList<ConnectorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConnectors(CancellationToken ct)
    {
        var connectors = await svc.GetConnectorsAsync(ct);
        return Ok(connectors.Select(ConnectorDto.From).ToList());
    }

    [HttpGet("connectors/{slug}")]
    [ProducesResponseType(typeof(ConnectorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConnector(string slug, CancellationToken ct)
    {
        var connector = await svc.GetConnectorAsync(slug, ct);
        if (connector is null) return NotFound();
        return Ok(ConnectorDto.From(connector));
    }

    [HttpGet("souls/{soulId:guid}/installs")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<InstallationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInstallations(Guid soulId, CancellationToken ct)
    {
        var userId        = GetUserId();
        var installations = await svc.GetInstallationsAsync(userId, soulId, ct);
        return Ok(installations.Select(InstallationDto.From).ToList());
    }

    [HttpPost("souls/{soulId:guid}/installs")]
    [Authorize]
    [ProducesResponseType(typeof(InstallationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Install(Guid soulId, [FromBody] InstallRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ConnectorSlug))
            return BadRequest(new { error = "connector_slug is required." });

        try
        {
            var userId       = GetUserId();
            var installation = await svc.InstallAsync(userId, soulId, request.ConnectorSlug, ct);
            return StatusCode(StatusCodes.Status201Created, InstallationDto.From(installation));
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("installs/{installationId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Uninstall(Guid installationId, CancellationToken ct)
    {
        await svc.UninstallAsync(GetUserId(), installationId, ct);
        return NoContent();
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }
}
