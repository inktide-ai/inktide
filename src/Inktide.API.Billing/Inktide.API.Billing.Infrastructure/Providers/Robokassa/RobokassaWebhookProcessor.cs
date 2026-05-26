using System.Security.Cryptography;
using System.Text;
using System.Web;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Idempotency;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Billing.Infrastructure.Providers.Robokassa;

public sealed class RobokassaWebhookProcessor : IWebhookProcessor
{
    public string ProviderId => "robokassa";

    private readonly RobokassaSettings _settings;
    private readonly ISubscriptionRepository _subscriptions;
    private readonly IPaymentReceiptEmailService _emailService;
    private readonly IConnectionMultiplexer _redis;
    private readonly TimeProvider _time;
    private readonly ILogger<RobokassaWebhookProcessor> _logger;

    public RobokassaWebhookProcessor(
        RobokassaSettings settings,
        ISubscriptionRepository subscriptions,
        IPaymentReceiptEmailService emailService,
        IConnectionMultiplexer redis,
        TimeProvider time,
        ILogger<RobokassaWebhookProcessor> logger)
    {
        _settings      = settings      ?? throw new ArgumentNullException(nameof(settings));
        _subscriptions = subscriptions ?? throw new ArgumentNullException(nameof(subscriptions));
        _emailService  = emailService  ?? throw new ArgumentNullException(nameof(emailService));
        _redis         = redis         ?? throw new ArgumentNullException(nameof(redis));
        _time          = time          ?? throw new ArgumentNullException(nameof(time));
        _logger        = logger        ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Robokassa authenticates via MD5 signature in the form body (Password2-based).
    /// IP allowlisting and header-based tokens are not part of the Robokassa protocol;
    /// <paramref name="headers"/> and <paramref name="clientIp"/> are unused here.
    /// </summary>
    public bool ValidateSignature(
        IReadOnlyDictionary<string, IReadOnlyList<string>> headers,
        byte[] rawBody,
        string? clientIp)
    {
        var form = ParseForm(rawBody);

        if (!form.TryGetValue("OutSum", out var outSum)       ||
            !form.TryGetValue("InvId", out var invId)         ||
            !form.TryGetValue("SignatureValue", out var sig)  ||
            !form.TryGetValue("Shp_UserId", out var shpUserId))
        {
            _logger.LogWarning("Robokassa webhook: missing required fields");
            return false;
        }

        // Shp_* params in alphabetical order: Email < Plan < UserId
        form.TryGetValue("Shp_Email", out var shpEmail);
        form.TryGetValue("Shp_Plan",  out var shpPlan);
        var shpPart = BuildShpPart(shpEmail, shpPlan, shpUserId);

        var expected = RobokassaSignature.ComputeMd5Hex($"{outSum}:{invId}:{_settings.Password2}:{shpPart}");

        // Constant-time comparison — expected is always uppercase (ComputeMd5Hex), normalize sig to match.
        var normalizedSig = sig.ToUpperInvariant();
        if (normalizedSig.Length != expected.Length ||
            !CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(normalizedSig),
                Encoding.UTF8.GetBytes(expected)))
        {
            _logger.LogWarning("Robokassa webhook: signature mismatch for InvId={InvId}", invId);
            return false;
        }

        return true;
    }

    public async Task ProcessAsync(byte[] rawBody, CancellationToken ct = default)
    {
        var form = ParseForm(rawBody);

        if (!form.TryGetValue("InvId", out var invIdStr) ||
            !form.TryGetValue("Shp_UserId", out var userId) ||
            string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Robokassa webhook: missing InvId or Shp_UserId");
            return;
        }

        form.TryGetValue("Shp_Email", out var shpEmail);
        var email = string.IsNullOrEmpty(shpEmail) ? null : shpEmail;

        var db      = _redis.GetDatabase();
        var doneKey = $"billing:webhook:done:robokassa:{invIdStr}";
        var lockKey = $"billing:webhook:processing:robokassa:{invIdStr}";

        await WebhookIdempotencyGuard.RunOnceAsync(
            db, doneKey, lockKey,
            (d, dk, token) => ProcessCoreAsync(form, invIdStr, userId, email, d, dk, token),
            _logger, ct).ConfigureAwait(false);
    }

    private async Task ProcessCoreAsync(
        Dictionary<string, string> form,
        string invId,
        string userId,
        string? email,
        IDatabase db,
        string doneKey,
        CancellationToken ct)
    {
        var utcNow = _time.GetUtcNow().UtcDateTime;
        var sub = await _subscriptions.GetByUserIdAsync(userId, ct).ConfigureAwait(false)
            ?? new UserSubscription { UserId = userId };

        form.TryGetValue("Shp_Plan", out var shpPlanStr);

        sub.Plan               = ParsePlan(shpPlanStr);
        sub.Status             = SubStatus.Active;
        sub.Provider           = ProviderId;
        sub.ProviderSubId      = invId;
        sub.ProviderCustomerId = invId;
        sub.CurrentPeriodEnd   = utcNow.Add(BillingCycle.Monthly);
        sub.UpdatedAt          = utcNow;

        await _subscriptions.UpsertAsync(sub, ct).ConfigureAwait(false);

        _logger.LogInformation("Robokassa {Plan} activated for user {UserId}, InvId={InvId}, period ends {End}",
            sub.Plan, userId, invId, sub.CurrentPeriodEnd);

        if (!string.IsNullOrEmpty(email))
            await _emailService.SendReceiptAsync(email, sub.Plan.ToString(), "Robokassa",
                sub.CurrentPeriodEnd ?? utcNow.Add(BillingCycle.Monthly), ct).ConfigureAwait(false);

        try
        {
            await db.StringSetAsync(doneKey, "1", TimeSpan.FromHours(72)).WaitAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Robokassa: failed to set done key for InvId={InvId}", invId);
        }
    }

    private static PlanType ParsePlan(string? plan) =>
        string.Equals(plan, "starter", StringComparison.OrdinalIgnoreCase)
            ? PlanType.Starter
            : PlanType.Pro;

    /// <summary>Assembles Shp_* part of the Robokassa signature in alphabetical key order (E &lt; P &lt; U).</summary>
    private static string BuildShpPart(string? shpEmail, string? shpPlan, string shpUserId)
    {
        var parts = new List<string>();
        if (!string.IsNullOrEmpty(shpEmail)) parts.Add($"Shp_Email={shpEmail}");
        if (!string.IsNullOrEmpty(shpPlan))  parts.Add($"Shp_Plan={shpPlan}");
        parts.Add($"Shp_UserId={shpUserId}");
        return string.Join(":", parts);
    }

    private static Dictionary<string, string> ParseForm(byte[] rawBody)
    {
        var decoded = HttpUtility.ParseQueryString(Encoding.UTF8.GetString(rawBody));
        var result  = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (string? key in decoded)
        {
            if (key is not null)
                result[key] = decoded[key] ?? string.Empty;
        }
        return result;
    }

}
