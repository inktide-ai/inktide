using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.Infrastructure.Providers.LemonSqueezy;

public sealed class LemonSqueezyWebhookProcessor : IWebhookProcessor
{
    public string ProviderId => "lemon_squeezy";

    private readonly ISubscriptionRepository _subscriptions;
    private readonly ILogger<LemonSqueezyWebhookProcessor> _logger;

    public LemonSqueezyWebhookProcessor(
        ISubscriptionRepository subscriptions,
        ILogger<LemonSqueezyWebhookProcessor> logger)
    {
        _subscriptions = subscriptions;
        _logger = logger;
    }

    public bool ValidateSignature(IHeaderDictionary headers, byte[] rawBody, string signingSecret, System.Net.IPAddress? clientIp)
    {
        if (!headers.TryGetValue("X-Signature", out var sigHeader) || string.IsNullOrEmpty(sigHeader))
            return false;

        var keyBytes = Encoding.UTF8.GetBytes(signingSecret);
        var hash = HMACSHA256.HashData(keyBytes, rawBody);
        var computed = Convert.ToHexString(hash).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(sigHeader.ToString().ToLowerInvariant()));
    }

    public async Task ProcessAsync(byte[] rawBody, CancellationToken ct = default)
    {
        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;

        if (!root.TryGetProperty("meta", out var meta)) return;
        if (!meta.TryGetProperty("event_name", out var eventEl)) return;

        var eventName = eventEl.GetString() ?? string.Empty;
        var data = root.GetProperty("data");
        var attrs = data.GetProperty("attributes");

        var providerSubId = data.GetProperty("id").GetString() ?? string.Empty;
        var providerCustomerId = attrs.TryGetProperty("customer_id", out var cidEl)
            ? cidEl.GetRawText().Trim('"')
            : string.Empty;

        // Extract our user_id from custom checkout data
        var userId = string.Empty;
        if (meta.TryGetProperty("custom_data", out var customData) &&
            customData.TryGetProperty("user_id", out var userIdEl))
            userId = userIdEl.GetString() ?? string.Empty;

        // If no userId in meta (subscription_updated events), look up by providerSubId
        if (string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(providerSubId))
        {
            var existing = await _subscriptions.GetByProviderSubIdAsync(providerSubId, ct).ConfigureAwait(false);
            userId = existing?.UserId ?? string.Empty;
        }

        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("LemonSqueezy webhook {Event}: could not resolve userId for sub {SubId}", eventName, providerSubId);
            return;
        }

        var status = MapStatus(attrs.TryGetProperty("status", out var statusEl) ? statusEl.GetString() : null);
        DateTime? periodEnd = null;
        if (attrs.TryGetProperty("renews_at", out var renewsEl) && renewsEl.ValueKind != JsonValueKind.Null)
            periodEnd = renewsEl.GetDateTime();
        else if (attrs.TryGetProperty("ends_at", out var endsEl) && endsEl.ValueKind != JsonValueKind.Null)
            periodEnd = endsEl.GetDateTime();

        var plan = status is SubStatus.Active or SubStatus.Trialing ? PlanType.Pro : PlanType.Free;

        var subscription = await _subscriptions.GetByUserIdAsync(userId, ct).ConfigureAwait(false)
            ?? new UserSubscription { UserId = userId };

        subscription.Plan = plan;
        subscription.Status = status;
        subscription.Provider = ProviderId;
        subscription.ProviderSubId = providerSubId;
        subscription.ProviderCustomerId = providerCustomerId;
        subscription.CurrentPeriodEnd = periodEnd;
        subscription.UpdatedAt = DateTime.UtcNow;

        await _subscriptions.UpsertAsync(subscription, ct).ConfigureAwait(false);

        _logger.LogInformation(
            "LemonSqueezy {Event}: user={UserId} plan={Plan} status={Status} periodEnd={End}",
            eventName, userId, plan, status, periodEnd);
    }

    private static SubStatus MapStatus(string? lsStatus) => lsStatus switch
    {
        "active"      => SubStatus.Active,
        "on_trial"    => SubStatus.Trialing,
        "cancelled"   => SubStatus.Cancelled,
        "expired"     => SubStatus.Expired,
        "past_due"    => SubStatus.PastDue,
        "unpaid"      => SubStatus.PastDue,
        _             => SubStatus.Active,
    };
}
