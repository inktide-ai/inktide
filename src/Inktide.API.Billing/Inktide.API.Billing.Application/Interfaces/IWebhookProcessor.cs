namespace Inktide.API.Billing.Application.Interfaces;

/// <summary>
/// Provider-specific webhook handler. Each payment provider has its own implementation.
/// Validates the incoming request signature and processes subscription lifecycle events.
/// </summary>
public interface IWebhookProcessor
{
    /// <summary>Matches <c>POST /api/billing/webhook/{provider}</c> route segment.</summary>
    string ProviderId { get; }

    /// <param name="headers">Request headers — caller maps from <c>IHeaderDictionary</c> before invoking.</param>
    /// <param name="rawBody">Raw request body bytes, required for HMAC validation.</param>
    /// <param name="clientIp">
    /// Resolved client IP string from <c>HttpContext.Connection.RemoteIpAddress?.ToString()</c>
    /// after ForwardedHeadersMiddleware. Never parsed from headers inside this method.
    /// </param>
    bool ValidateSignature(
        IReadOnlyDictionary<string, IReadOnlyList<string>> headers,
        byte[] rawBody,
        string? clientIp);

    Task ProcessAsync(byte[] rawBody, CancellationToken ct = default);
}
