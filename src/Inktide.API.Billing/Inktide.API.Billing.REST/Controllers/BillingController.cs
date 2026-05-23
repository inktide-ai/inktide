using System.Security.Claims;
using Inktide.API.Billing.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Inktide.API.Billing.REST.Controllers;

[ApiController]
[Route("api/billing")]
[Produces("application/json")]
[Authorize]
public sealed class BillingController : ControllerBase
{
    private readonly ISubscriptionService _subscriptions;

    public BillingController(ISubscriptionService subscriptions)
    {
        _subscriptions = subscriptions ?? throw new ArgumentNullException(nameof(subscriptions));
    }

    /// <summary>Returns the current user's subscription plan and status.</summary>
    [HttpGet("subscription")]
    [ProducesResponseType(typeof(SubscriptionResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubscription(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var sub = await _subscriptions.GetSubscriptionAsync(userId, ct).ConfigureAwait(false);
        return Ok(new SubscriptionResponse
        {
            Plan       = sub.Plan.ToString().ToLowerInvariant(),
            Status     = sub.Status.ToString().ToLowerInvariant(),
            Provider   = sub.Provider,
            PeriodEnd  = sub.CurrentPeriodEnd,
        });
    }

    /// <summary>Creates a hosted checkout session and returns the redirect URL.</summary>
    [HttpPost("checkout")]
    [ProducesResponseType(typeof(CheckoutResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequest? body, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var email  = User.FindFirstValue("email") ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        if (userId is null) return Unauthorized();

        var url = await _subscriptions.CreateCheckoutUrlAsync(userId, email, body?.ReturnUrl ?? string.Empty, ct)
            .ConfigureAwait(false);

        return Ok(new CheckoutResponse { CheckoutUrl = url });
    }

    /// <summary>Returns the billing portal URL for managing an existing subscription.</summary>
    [HttpPost("portal")]
    [ProducesResponseType(typeof(PortalResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreatePortal([FromBody] PortalRequest? body, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var url = await _subscriptions.CreatePortalUrlAsync(userId, body?.ReturnUrl ?? string.Empty, ct)
            .ConfigureAwait(false);

        if (url is null) return NotFound(new { message = "No active subscription found." });

        return Ok(new PortalResponse { PortalUrl = url });
    }


    public sealed class SubscriptionResponse
    {
        public string Plan { get; init; } = "free";
        public string Status { get; init; } = "active";
        public string? Provider { get; init; }
        public DateTime? PeriodEnd { get; init; }
    }

    public sealed class CheckoutRequest  { public string? ReturnUrl { get; init; } }
    public sealed class CheckoutResponse { public string CheckoutUrl { get; init; } = string.Empty; }
    public sealed class PortalRequest    { public string? ReturnUrl { get; init; } }
    public sealed class PortalResponse   { public string PortalUrl  { get; init; } = string.Empty; }
}
