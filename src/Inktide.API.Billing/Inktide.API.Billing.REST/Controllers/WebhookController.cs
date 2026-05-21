using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.Settings;
using Inktide.API.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.REST.Controllers;

/// <summary>
/// Routes incoming webhooks to the appropriate provider processor.
/// All webhook endpoints are unauthenticated — signature validation is the security mechanism.
/// </summary>
[ApiController]
[Route("api/billing/webhook")]
public sealed class WebhookController : ControllerBase
{
    private readonly IEnumerable<IWebhookProcessor> _processors;
    private readonly LemonSqueezySettings _lsSettings;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        IEnumerable<IWebhookProcessor> processors,
        LemonSqueezySettings lsSettings,
        ILogger<WebhookController> logger)
    {
        _processors = processors;
        _lsSettings = lsSettings;
        _logger = logger;
    }

    [HttpPost("{provider}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Handle(string provider, CancellationToken ct)
    {
        // Read raw bytes before any deserialization — needed for HMAC validation
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

        var clientIp = HttpContext.Connection.RemoteIpAddress;
        var secret = GetSigningSecret(provider);
        if (!processor.ValidateSignature(Request.Headers, rawBody, secret, clientIp))
        {
            _logger.LogWarning("Webhook signature validation failed for provider: {Provider}", provider);
            return Unauthorized();
        }

        // Process synchronously — non-200 response signals the provider to retry.
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

    private string GetSigningSecret(string provider) => provider.ToLowerInvariant() switch
    {
        "lemon_squeezy" => _lsSettings.WebhookSigningSecret,
        "yookassa"      => string.Empty,   // no HMAC — verified via re-fetch in processor
        _ => string.Empty,
    };
}
