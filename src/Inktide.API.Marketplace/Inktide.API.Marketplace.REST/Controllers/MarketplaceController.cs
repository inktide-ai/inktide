using Inktide.API.Core.Pagination;
using Inktide.API.Marketplace.Application.Interfaces;
using Inktide.API.Marketplace.REST.Filters;
using Inktide.API.Marketplace.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Marketplace.REST.Controllers;

[ApiController]
[Route("api/v1/marketplace")]
[Produces("application/json")]
[TypeFilter(typeof(MarketplaceExceptionFilter))]
public sealed class MarketplaceController(IMarketplaceService svc) : ControllerBase
{
    [HttpGet("connectors")]
    [ProducesResponseType(typeof(PagedResult<ConnectorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConnectors(
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0,
        CancellationToken ct = default)
    {
        if (limit is < 1 or > 200) limit = 50;
        if (offset < 0) offset = 0;
        var paged = await svc.GetConnectorsPagedAsync(limit, offset, ct);
        var items = paged.Items.Select(ConnectorDto.From).ToList();
        return Ok(new PagedResult<ConnectorDto>(items, paged.NextCursor, paged.HasMore));
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
