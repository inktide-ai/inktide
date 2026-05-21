using System.Net;
using System.Text.Json;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Billing.Infrastructure.Providers.YooKassa;

public sealed class YooKassaWebhookProcessor : IWebhookProcessor
{
    public string ProviderId => "yookassa";

    // Published YooKassa outbound IP ranges: https://yookassa.ru/developers/using-api/webhooks
    private static readonly IPNetwork[] DefaultAllowedNetworks =
    [
        IPNetwork.Parse("185.71.76.0/27"),
        IPNetwork.Parse("185.71.77.0/27"),
        IPNetwork.Parse("77.75.153.0/25"),
        IPNetwork.Parse("77.75.154.128/25"),
        IPNetwork.Parse("2a02:5180:0:1509::/64"),
        IPNetwork.Parse("2a02:5180:0:2655::/64"),
        IPNetwork.Parse("2a02:5180:0:1533::/64"),
        IPNetwork.Parse("2a02:5180:0:2669::/64"),
    ];

    private static readonly IPNetwork[] BlockedNetworks =
    [
        IPNetwork.Parse("10.0.0.0/8"),
        IPNetwork.Parse("172.16.0.0/12"),
        IPNetwork.Parse("192.168.0.0/16"),
        IPNetwork.Parse("127.0.0.0/8"),
        IPNetwork.Parse("169.254.0.0/16"),
        IPNetwork.Parse("::1/128"),
        IPNetwork.Parse("fc00::/7"),
        IPNetwork.Parse("fe80::/10"),
    ];

    private readonly YooKassaSettings _settings;
    private readonly ISubscriptionRepository _subscriptions;
    private readonly HttpClient _http;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<YooKassaWebhookProcessor> _logger;

    public YooKassaWebhookProcessor(
        HttpClient http,
        YooKassaSettings settings,
        ISubscriptionRepository subscriptions,
        IConnectionMultiplexer redis,
        ILogger<YooKassaWebhookProcessor> logger)
    {
        _http          = http          ?? throw new ArgumentNullException(nameof(http));
        _settings      = settings      ?? throw new ArgumentNullException(nameof(settings));
        _subscriptions = subscriptions ?? throw new ArgumentNullException(nameof(subscriptions));
        _redis         = redis         ?? throw new ArgumentNullException(nameof(redis));
        _logger        = logger        ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// YooKassa doesn't use HMAC. Security model: IP allowlist (CIDR) + re-fetch via API in ProcessAsync.
    /// clientIp must be the resolved address from HttpContext.Connection.RemoteIpAddress after
    /// ForwardedHeadersMiddleware — never parsed from headers inside this method.
    /// </summary>
    public bool ValidateSignature(IHeaderDictionary headers, byte[] rawBody, string signingSecret, IPAddress? clientIp)
    {
        if (clientIp is null)
        {
            _logger.LogWarning("YooKassa webhook: clientIp is null (ForwardedHeadersMiddleware not configured?), rejecting");
            return false;
        }

        if (BlockedNetworks.Any(n => n.Contains(clientIp)))
        {
            _logger.LogWarning("YooKassa webhook: RFC1918/loopback IP {Ip} rejected", clientIp);
            return false;
        }

        IPNetwork[] allowedNetworks = _settings.WebhookAllowedIps.Length > 0
            ? [.. _settings.WebhookAllowedIps
                .Where(c => IPNetwork.TryParse(c, out _))
                .Select(IPNetwork.Parse)]
            : DefaultAllowedNetworks;

        if (allowedNetworks.Any(n => n.Contains(clientIp)))
            return true;

        _logger.LogWarning("YooKassa webhook: IP {Ip} not in allowlist, rejecting", clientIp);
        return false;
    }

    public async Task ProcessAsync(byte[] rawBody, CancellationToken ct = default)
    {
        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;

        if (!root.TryGetProperty("event", out var eventEl)) return;
        var eventName = eventEl.GetString() ?? string.Empty;

        if (!root.TryGetProperty("object", out var obj)) return;
        var paymentId = obj.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
        if (string.IsNullOrEmpty(paymentId)) return;

        // UUID validation before URL construction — prevents path traversal and log injection.
        // YooKassa payment IDs are UUID v4.
        if (!Guid.TryParse(paymentId, out _))
        {
            _logger.LogWarning("YooKassa: invalid paymentId format '{Id}', rejecting", paymentId);
            return;
        }

        var db      = _redis.GetDatabase();
        var doneKey = $"billing:webhook:done:{paymentId}:{eventName}";
        var lockKey = $"billing:webhook:processing:{paymentId}:{eventName}";
        var lockAcquired = false;

        try
        {
            if (await db.KeyExistsAsync(doneKey).ConfigureAwait(false)) return;

            lockAcquired = await db.StringSetAsync(
                lockKey, "1",
                expiry: TimeSpan.FromSeconds(30),
                when: When.NotExists).ConfigureAwait(false);

            if (!lockAcquired) return;

            // Double-check after lock: another instance may have completed between KeyExists and lock acquire.
            if (await db.KeyExistsAsync(doneKey).ConfigureAwait(false)) return;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "YooKassa idempotency check failed for {PaymentId}:{Event}, processing without dedup", paymentId, eventName);
            lockAcquired = false;
        }

        try
        {
            await ProcessCoreAsync(paymentId, eventName, db, doneKey, ct).ConfigureAwait(false);
        }
        finally
        {
            if (lockAcquired)
            {
                try { await db.KeyDeleteAsync(lockKey).ConfigureAwait(false); }
                catch { /* lock TTL=30s handles cleanup on crash */ }
            }
        }
    }

    private async Task ProcessCoreAsync(
        string paymentId,
        string eventName,
        IDatabase db,
        string doneKey,
        CancellationToken ct)
    {
        using var fetchCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        fetchCts.CancelAfter(TimeSpan.FromSeconds(5));

        var verified = await FetchPaymentAsync(paymentId, fetchCts.Token).ConfigureAwait(false);
        if (verified is null)
        {
            _logger.LogWarning("YooKassa webhook: could not verify payment {PaymentId}", paymentId);
            return;
        }

        var userId = string.Empty;
        if (verified.Value.TryGetProperty("metadata", out var meta) &&
            meta.TryGetProperty("user_id", out var userIdEl))
            userId = userIdEl.GetString() ?? string.Empty;

        if (string.IsNullOrEmpty(userId))
        {
            var existing = await _subscriptions.GetByProviderSubIdAsync(paymentId, ct).ConfigureAwait(false);
            userId = existing?.UserId ?? string.Empty;
        }

        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("YooKassa {Event}: cannot resolve userId for payment {PaymentId}", eventName, paymentId);
            return;
        }

        var verifiedStatus = verified.Value.TryGetProperty("status", out var statusEl)
            ? statusEl.GetString()
            : null;

        var paymentMethodId = string.Empty;
        if (verified.Value.TryGetProperty("payment_method", out var pm) &&
            pm.TryGetProperty("id", out var pmIdEl))
            paymentMethodId = pmIdEl.GetString() ?? string.Empty;

        var sub = await _subscriptions.GetByUserIdAsync(userId, ct).ConfigureAwait(false)
            ?? new UserSubscription { UserId = userId };

        switch (eventName)
        {
            case "payment.succeeded" when verifiedStatus == "succeeded":
                sub.Plan               = PlanType.Pro;
                sub.Status             = SubStatus.Active;
                sub.Provider           = ProviderId;
                sub.ProviderSubId      = paymentMethodId;
                sub.ProviderCustomerId = paymentId;
                sub.CurrentPeriodEnd   = DateTime.UtcNow.AddDays(30);
                sub.UpdatedAt          = DateTime.UtcNow;
                _logger.LogInformation("YooKassa Pro activated for user {UserId}, period ends {End}", userId, sub.CurrentPeriodEnd);
                break;

            case "payment.canceled" when verifiedStatus == "canceled":
                // Skip stale cancel: subscription was renewed by a different payment after this one was cancelled.
                if (sub.Status == SubStatus.Active
                    && !string.IsNullOrEmpty(sub.ProviderCustomerId)
                    && sub.ProviderCustomerId != paymentId)
                {
                    _logger.LogWarning(
                        "YooKassa: cancel for {PaymentId} but active sub uses {ActivePaymentId}, skipping",
                        paymentId, sub.ProviderCustomerId);
                    return;
                }
                sub.Status    = SubStatus.Cancelled;
                sub.Plan      = PlanType.Free;
                sub.UpdatedAt = DateTime.UtcNow;
                _logger.LogInformation("YooKassa subscription cancelled for user {UserId}", userId);
                break;

            case "refund.succeeded" when verifiedStatus is "canceled" or "succeeded":
                sub.Status    = SubStatus.Cancelled;
                sub.Plan      = PlanType.Free;
                sub.UpdatedAt = DateTime.UtcNow;
                _logger.LogInformation("YooKassa refund processed for user {UserId}", userId);
                break;

            default:
                _logger.LogDebug("YooKassa unhandled event {Event} for payment {PaymentId}", eventName, paymentId);
                return;
        }

        await _subscriptions.UpsertAsync(sub, ct).ConfigureAwait(false);

        try
        {
            await db.StringSetAsync(doneKey, "1", TimeSpan.FromHours(72)).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "YooKassa: failed to set done key for {PaymentId}:{Event}", paymentId, eventName);
        }
    }

    private async Task<JsonElement?> FetchPaymentAsync(string paymentId, CancellationToken ct)
    {
        try
        {
            using var response = await _http.GetAsync($"/v3/payments/{paymentId}", ct).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.Clone();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "YooKassa re-fetch failed for payment {PaymentId}", paymentId);
            return null;
        }
    }
}
