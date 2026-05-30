using Inktide.API.Developer.Application.Interfaces;
using Inktide.API.Developer.Application.Models;
using Inktide.API.Developer.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Inktide.API.Developer.REST.Controllers;

[ApiController]
[Route("api/developer")]
[Authorize]
public sealed class DeveloperAppsController(
    IDeveloperAppService appService,
    IWebhookDispatchService webhookDispatch) : ControllerBase
{
    [HttpPost("apps")]
    [ProducesResponseType<ApplicationDto>(201)]
    public async Task<IActionResult> Create([FromBody] CreateApplicationRequest req, CancellationToken ct)
    {
        var ownerId = GetUserId();
        var cmd = new CreateApplicationCommand(
            req.Name, req.Description, req.IconUrl,
            req.RedirectUris, req.WebhookUrl, req.WebhookSecret,
            req.Scopes ?? []);

        var dto = await appService.CreateAsync(ownerId, cmd, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpGet("apps")]
    [ProducesResponseType<IReadOnlyList<ApplicationDto>>(200)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var apps = await appService.GetByOwnerAsync(GetUserId(), ct);
        return Ok(apps);
    }

    [HttpGet("apps/{id:guid}")]
    [ProducesResponseType<ApplicationDto>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var dto = await appService.GetByIdAsync(id, GetUserId(), ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPut("apps/{id:guid}")]
    [ProducesResponseType<ApplicationDto>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateApplicationRequest req, CancellationToken ct)
    {
        var cmd = new UpdateApplicationCommand(
            req.Name, req.Description, req.IconUrl,
            req.RedirectUris, req.WebhookUrl, req.WebhookSecret,
            req.Scopes ?? []);

        var dto = await appService.UpdateAsync(id, GetUserId(), cmd, ct);
        return Ok(dto);
    }

    [HttpDelete("apps/{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await appService.DeleteAsync(id, GetUserId(), ct);
        return NoContent();
    }

    [HttpPost("apps/{id:guid}/rotate-secret")]
    [ProducesResponseType<ApplicationDto>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RotateSecret(Guid id, CancellationToken ct)
    {
        var dto = await appService.RotateSecretAsync(id, GetUserId(), ct);
        return Ok(dto);
    }

    [HttpGet("apps/{id:guid}/deliveries")]
    [ProducesResponseType<IReadOnlyList<WebhookDeliveryDto>>(200)]
    public async Task<IActionResult> GetDeliveries(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var deliveries = await appService.GetDeliveriesAsync(id, GetUserId(), page, Math.Min(pageSize, 100), ct);
        return Ok(deliveries);
    }

    [HttpPost("webhooks/test")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> TestWebhook([FromQuery] Guid appId, CancellationToken ct)
    {
        await webhookDispatch.SendTestPingAsync(appId, GetUserId(), ct);
        return NoContent();
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User ID claim missing.");
}
