using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Idempotency;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Billing.Infrastructure.Providers.Stripe;

public sealed class StripeWebhookProcessor : IWebhookProcessor
{
    public string ProviderId => "stripe";

    // Reject webhooks older than 5 minutes (replay attack protection).
    private static readonly TimeSpan MaxAge = TimeSpan.FromMinutes(5);

    private readonly StripeSettings _settings;
    private readonly ISubscriptionRepository _subscriptions;
    private readonly IPaymentReceiptEmailService _emailService;
    private readonly IConnectionMultiplexer _redis;
    private readonly TimeProvider _time;
    private readonly ILogger<StripeWebhookProcessor> _logger;

    public StripeWebhookProcessor(
        StripeSettings settings,
        ISubscriptionRepository subscriptions,
        IPaymentReceiptEmailService emailService,
        IConnectionMultiplexer redis,
        TimeProvider time,
        ILogger<StripeWebhookProcessor> logger)
    {
        _settings      = settings      ?? throw new ArgumentNullException(nameof(settings));
        _subscriptions = subscriptions ?? throw new ArgumentNullException(nameof(subscriptions));
        _emailService  = emailService  ?? throw new ArgumentNullException(nameof(emailService));
        _redis         = redis         ?? throw new ArgumentNullException(nameof(redis));
        _time          = time          ?? throw new ArgumentNullException(nameof(time));
        _logger        = logger        ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Stripe signature: header Stripe-Signature: t={ts},v1={hmac}
    /// Signed payload: "{t}.{rawBody}", HMAC-SHA256 with WebhookSecret.
    /// </summary>
    public bool ValidateSignature(
        IReadOnlyDictionary<string, IReadOnlyList<string>> headers,
        byte[] rawBody,
        string? clientIp)
    {
        if (!headers.TryGetValue("Stripe-Signature", out var sigValues) || sigValues.Count == 0)
        {
            _logger.LogWarning("Stripe webhook: missing Stripe-Signature header");
            return false;
        }

        // Join multiple header occurrences (HTTP allows duplicates; Stripe may send multiple v1= values).
        var parts = string.Join(",", sigValues).Split(',', StringSplitOptions.RemoveEmptyEntries);
        var timestamp = ExtractValue(parts, "t");
        var signature = ExtractValue(parts, "v1");

        if (timestamp is null || signature is null)
        {
            _logger.LogWarning("Stripe webhook: malformed Stripe-Signature header");
            return false;
        }

        if (!long.TryParse(timestamp, out var ts))
        {
            _logger.LogWarning("Stripe webhook: non-numeric timestamp in Stripe-Signature");
            return false;
        }

        var eventTime = DateTimeOffset.FromUnixTimeSeconds(ts);
        var age = _time.GetUtcNow() - eventTime;
        if (age > MaxAge || age < -MaxAge)
        {
            _logger.LogWarning("Stripe webhook: timestamp too old or in future ({Age}s)", age.TotalSeconds);
            return false;
        }

        var payload = $"{timestamp}.{Encoding.UTF8.GetString(rawBody)}";
        var key     = Encoding.UTF8.GetBytes(_settings.WebhookSecret);
        var mac     = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(payload));
        var computed = Convert.ToHexString(mac).ToLowerInvariant();

        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(computed),
                Encoding.UTF8.GetBytes(signature)))
        {
            _logger.LogWarning("Stripe webhook: HMAC mismatch");
            return false;
        }

        return true;
    }

    public async Task ProcessAsync(byte[] rawBody, CancellationToken ct = default)
    {
        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;

        var eventId   = root.TryGetProperty("id",   out var idEl)   ? idEl.GetString()   : null;
        var eventType = root.TryGetProperty("type", out var typeEl)  ? typeEl.GetString() : null;

        if (string.IsNullOrEmpty(eventId) || string.IsNullOrEmpty(eventType)) return;

        if (!root.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("object", out var obj)) return;

        var db      = _redis.GetDatabase();
        var doneKey = $"billing:webhook:done:stripe:{eventId}";
        var lockKey = $"billing:webhook:processing:stripe:{eventId}";

        // obj is backed by doc; the lambda is awaited before ProcessAsync returns, so doc stays alive.
        await WebhookIdempotencyGuard.RunOnceAsync(
            db, doneKey, lockKey,
            (d, dk, token) => ProcessCoreAsync(eventId, eventType, obj, d, dk, token),
            _logger, ct).ConfigureAwait(false);
    }

    private async Task ProcessCoreAsync(
        string eventId,
        string eventType,
        JsonElement obj,
        IDatabase db,
        string doneKey,
        CancellationToken ct)
    {
        var piId   = obj.TryGetProperty("id",     out var piEl)  ? piEl.GetString()  : null;
        var userId = string.Empty;
        var plan   = string.Empty;
        var utcNow = _time.GetUtcNow().UtcDateTime;

        if (obj.TryGetProperty("metadata", out var meta))
        {
            if (meta.TryGetProperty("user_id", out var uidEl)) userId = uidEl.GetString() ?? string.Empty;
            if (meta.TryGetProperty("plan",    out var planEl)) plan  = planEl.GetString() ?? string.Empty;
        }

        if (string.IsNullOrEmpty(plan))
        {
            _logger.LogWarning(
                "Stripe {Event}: missing 'plan' metadata for event {EventId} — skipping", eventType, eventId);
            return;
        }

        if (string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(piId))
        {
            var existing = await _subscriptions.GetByProviderSubIdAsync(piId, ct).ConfigureAwait(false);
            userId = existing?.UserId ?? string.Empty;
        }

        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Stripe {Event}: cannot resolve userId for event {EventId}", eventType, eventId);
            return;
        }

        var sub = await _subscriptions.GetByUserIdAsync(userId, ct).ConfigureAwait(false)
            ?? new UserSubscription { UserId = userId };

        switch (eventType)
        {
            case "payment_intent.succeeded":
                sub.Plan               = ParsePlan(plan);
                sub.Status             = SubStatus.Active;
                sub.Provider           = ProviderId;
                sub.ProviderSubId      = piId;
                sub.ProviderCustomerId = piId;
                sub.CurrentPeriodEnd   = utcNow.Add(BillingCycle.Monthly);
                sub.UpdatedAt          = utcNow;
                _logger.LogInformation("Stripe {Plan} activated for user {UserId}", plan, userId);
                break;

            case "payment_intent.payment_failed":
                sub.Status    = SubStatus.PastDue;
                sub.UpdatedAt = utcNow;
                _logger.LogInformation("Stripe payment failed for user {UserId}", userId);
                break;

            case "customer.subscription.deleted":
                sub.Status    = SubStatus.Cancelled;
                sub.Plan      = PlanType.Free;
                sub.UpdatedAt = utcNow;
                _logger.LogInformation("Stripe subscription deleted for user {UserId}", userId);
                break;

            default:
                _logger.LogDebug("Stripe unhandled event {Type} for {EventId}", eventType, eventId);
                return;
        }

        await _subscriptions.UpsertAsync(sub, ct).ConfigureAwait(false);

        // Receipt only for succeeded payments
        if (eventType == "payment_intent.succeeded")
        {
            var receiptEmail = obj.TryGetProperty("receipt_email", out var re) ? re.GetString() : null;
            if (!string.IsNullOrEmpty(receiptEmail))
                await _emailService.SendReceiptAsync(receiptEmail, sub.Plan.ToString(), "Stripe",
                    sub.CurrentPeriodEnd ?? utcNow.Add(BillingCycle.Monthly), ct).ConfigureAwait(false);
        }

        try
        {
            await db.StringSetAsync(doneKey, "1", TimeSpan.FromHours(72)).WaitAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Stripe: failed to set done key for {EventId}", eventId);
        }
    }

    private static PlanType ParsePlan(string plan) =>
        plan.Equals("starter", StringComparison.OrdinalIgnoreCase) ? PlanType.Starter : PlanType.Pro;

    private static string? ExtractValue(string[] parts, string key)
    {
        var prefix = $"{key}=";
        return parts.FirstOrDefault(p => p.StartsWith(prefix, StringComparison.Ordinal))
                   ?[prefix.Length..];
    }
}
