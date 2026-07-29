using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.REST.Controllers;

/// <summary>
/// Routes incoming webhooks to the appropriate provider processor.
/// All webhook endpoints are unauthenticated - signature validation is the security mechanism.
/// Each processor resolves its own signing secret from its injected settings.
/// </summary>
[ApiController]
[Route("api/v1/billing/webhooks")]
[EnableRateLimiting(BillingRestApiStartup.WebhookRateLimitPolicy)]
public sealed class WebhookController : ControllerBase
{
    private readonly IEnumerable<IWebhookProcessor> _processors;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        IEnumerable<IWebhookProcessor> processors,
        ILogger<WebhookController> logger)
    {
        _processors = processors;
        _logger     = logger;
    }

    [HttpPost("{provider}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Handle(string provider, CancellationToken ct)
    {
        // Read raw bytes before any deserialization - needed for HMAC validation
        using var ms = new MemoryStream();
        await Request.Body.CopyToAsync(ms, ct).ConfigureAwait(false);
        var rawBody = ms.ToArray();

        var processor = _processors.FirstOrDefault(p =>
            string.Equals(p.ProviderId, provider, StringComparison.OrdinalIgnoreCase));

        if (processor is null)
        {
            _logger.LogWarning("Webhook received for unknown provider: {Provider}", provider);
            return BadRequest(ApiErrorResponse.From($"Unknown provider: {provider}", "UNKNOWN_PROVIDER"));
        }

        var headers = Request.Headers.ToDictionary(
            h => h.Key,
            h => (IReadOnlyList<string>)h.Value.Where(v => v is not null).Select(v => v!).ToArray(),
            StringComparer.OrdinalIgnoreCase);
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        if (!processor.ValidateSignature(headers, rawBody, clientIp))
        {
            _logger.LogWarning("Webhook signature validation failed for provider: {Provider}", provider);
            return Unauthorized();
        }

        // Process synchronously - non-200 response signals the provider to retry.
        // Fire-and-forget would silently lose events if the background task crashes after
        // we already returned 200.
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(10));
        try
        {
            await processor.ProcessAsync(rawBody, timeout.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            _logger.LogError("Webhook processing timed out for provider {Provider}", provider);
            return StatusCode(StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Webhook processing failed for provider {Provider}", provider);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        return Ok();
    }
}
