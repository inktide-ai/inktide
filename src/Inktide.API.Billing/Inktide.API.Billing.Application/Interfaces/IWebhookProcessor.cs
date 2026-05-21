using System.Net;
using Microsoft.AspNetCore.Http;

namespace Inktide.API.Billing.Application.Interfaces;

/// <summary>
/// Provider-specific webhook handler. Each payment provider has its own implementation.
/// Validates the incoming request signature and processes subscription lifecycle events.
/// </summary>
public interface IWebhookProcessor
{
    /// <summary>Matches <c>POST /api/billing/webhook/{provider}</c> route segment.</summary>
    string ProviderId { get; }

    /// <param name="clientIp">Resolved client IP from <c>HttpContext.Connection.RemoteIpAddress</c> after ForwardedHeadersMiddleware.</param>
    bool ValidateSignature(IHeaderDictionary headers, byte[] rawBody, string signingSecret, IPAddress? clientIp);

    Task ProcessAsync(byte[] rawBody, CancellationToken ct = default);
}
