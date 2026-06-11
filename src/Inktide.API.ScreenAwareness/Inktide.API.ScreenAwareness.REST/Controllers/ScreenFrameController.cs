using System.Security.Claims;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Models;
using Inktide.API.ScreenAwareness.REST.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.ScreenAwareness.REST.Controllers;

[ApiController]
[Route("api/v1/screen")]
[Authorize]
public sealed class ScreenFrameController : ControllerBase
{
    private readonly IFrameIngestionService _ingestion;
    private readonly ILogger<ScreenFrameController> _logger;

    public ScreenFrameController(
        IFrameIngestionService ingestion,
        ILogger<ScreenFrameController> logger)
    {
        _ingestion = ingestion ?? throw new ArgumentNullException(nameof(ingestion));
        _logger    = logger    ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Ingests a single screen frame for vision processing.
    /// Returns 202 Accepted when the frame is queued, 204 No Content when deduplicated or feature disabled.
    /// </summary>
    [HttpPost("frames")]
    [EnableRateLimiting(ScreenAwarenessRestStartup.FrameIngestRateLimitPolicy)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status402PaymentRequired)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> IngestFrameAsync(
        [FromBody] IngestFrameRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var tenantId = GetTenantId();

        _logger.LogDebug(
            "Frame ingest: tenant={TenantId} character={CharacterId} session={SessionId}",
            tenantId, request.CharacterId, request.SessionId);

        var result = await _ingestion.IngestAsync(
            tenantId,
            request.CharacterId,
            request.SessionId,
            request.FrameDataBase64,
            request.ContentType,
            request.CapturedAtUnixMs,
            cancellationToken);

        return result switch
        {
            FrameIngestionResult.Queued         => Accepted(),
            FrameIngestionResult.DuplicateFrame => NoContent(),
            FrameIngestionResult.FeatureDisabled => NoContent(),
            FrameIngestionResult.BudgetExceeded => Problem(
                detail: "Hourly vision frame budget exceeded. Upgrade your plan or wait until the next hour.",
                statusCode: StatusCodes.Status402PaymentRequired),
            _ => Problem(statusCode: StatusCodes.Status500InternalServerError),
        };
    }

    private Guid GetTenantId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub")
                  ?? throw new UnauthorizedAccessException("Subject claim not found in token.");
        return Guid.Parse(sub);
    }
}
