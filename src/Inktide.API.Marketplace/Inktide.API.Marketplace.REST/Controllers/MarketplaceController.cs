using Inktide.API.Marketplace.Application.Interfaces;
using Inktide.API.Marketplace.REST.Filters;
using Inktide.API.Marketplace.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Marketplace.REST.Controllers;

[ApiController]
[Route("api/marketplace")]
[Produces("application/json")]
[TypeFilter(typeof(MarketplaceExceptionFilter))]
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
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInstallations(Guid soulId, CancellationToken ct)
    {
        var installations = await svc.GetInstallationsAsync(soulId, ct);
        return Ok(installations.Select(InstallationDto.From).ToList());
    }

    [HttpPost("souls/{soulId:guid}/installs")]
    [Authorize]
    [ProducesResponseType(typeof(InstallationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(InstallationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Install(Guid soulId, [FromBody] InstallRequest request, CancellationToken ct)
    {
        var result = await svc.InstallAsync(soulId, request.ConnectorSlug, ct);
        var dto    = InstallationDto.From(result.Installation);

        if (!result.IsNew)
            return Ok(dto);

        return CreatedAtAction(nameof(GetInstallations), new { soulId }, dto);
    }

    [HttpDelete("installs/{installationId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Uninstall(Guid installationId, CancellationToken ct)
    {
        await svc.UninstallAsync(installationId, ct);
        return NoContent();
    }
}
