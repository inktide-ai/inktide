using System.Net.Http.Headers;
using System.Text.Json;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.Infrastructure.Providers.Stripe;

public sealed class StripeService : IStripeService
{
    // EUR cents: starter 16€/mo, 144€/yr; pro 30€/mo, 288€/yr
    private static readonly Dictionary<string, int> Amounts = new(StringComparer.OrdinalIgnoreCase)
    {
        ["starter:monthly"] = 1600,
        ["starter:yearly"]  = 14400,
        ["pro:monthly"]     = 3000,
        ["pro:yearly"]      = 28800,
    };

    private readonly HttpClient _http;
    private readonly ILogger<StripeService> _logger;

    public StripeService(HttpClient http, StripeSettings settings, ILogger<StripeService> logger)
    {
        _http   = http     ?? throw new ArgumentNullException(nameof(http));
        _logger = logger   ?? throw new ArgumentNullException(nameof(logger));
        _ = settings ?? throw new ArgumentNullException(nameof(settings));

        // Auth header set per-instance so the typed HttpClient factory can configure it once.
        if (!string.IsNullOrEmpty(settings.SecretKey))
            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", settings.SecretKey);
    }

    public async Task<string> CreatePaymentIntentAsync(
        string userId,
        string userEmail,
        string plan,
        string period,
        CancellationToken ct = default)
    {
        var key = $"{plan}:{period}";
        if (!Amounts.TryGetValue(key, out var amount))
        {
            _logger.LogWarning(
                "StripeService: unknown plan/period key '{Key}', defaulting to pro:monthly. " +
                "Add the key to the Amounts dictionary or fix the caller.", key);
            amount = Amounts["pro:monthly"];
        }

        var form = new FormUrlEncodedContent(
        [
            new("amount",                              amount.ToString()),
            new("currency",                            "eur"),
            new("metadata[user_id]",                   userId),
            new("metadata[plan]",                      plan),
            new("metadata[period]",                    period),
            new("description",                         $"Inktide {plan} ({period})"),
            new("receipt_email",                       userEmail),
            new("automatic_payment_methods[enabled]",  "true"),
        ]);

        using var response = await _http.PostAsync("payment_intents", form, ct).ConfigureAwait(false);
        var body = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Stripe CreatePaymentIntent failed {Status}: {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Stripe error: {response.StatusCode}");
        }

        using var doc = JsonDocument.Parse(body);
        if (!doc.RootElement.TryGetProperty("client_secret", out var cs) || cs.ValueKind == JsonValueKind.Null)
            throw new InvalidOperationException("Stripe response missing client_secret");

        return cs.GetString()!;
    }
}
