using Inktide.API.Core.Generators;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.Infrastructure.Providers.YooKassa;

public sealed class YooKassaBillingProvider : IBillingProvider
{
    public string ProviderId => "yookassa";

    private readonly YooKassaSettings _settings;
    private readonly BillingSettings _billing;
    private readonly HttpClient _http;
    private readonly ILogger<YooKassaBillingProvider> _logger;

    public YooKassaBillingProvider(
        HttpClient http,
        YooKassaSettings settings,
        BillingSettings billing,
        ILogger<YooKassaBillingProvider> logger)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _billing = billing ?? throw new ArgumentNullException(nameof(billing));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<string> CreateCheckoutUrlAsync(CreateCheckoutRequest request, CancellationToken ct = default)
    {
        var isStarter = request.Plan == PlanType.Starter;
        var amount      = isStarter ? _settings.StarterPriceAmount : _settings.ProPriceAmount;
        var description = isStarter ? _settings.StarterDescription  : _settings.ProDescription;

        var body = new JsonObject
        {
            ["amount"] = new JsonObject
            {
                ["value"]    = amount,
                ["currency"] = _settings.PriceCurrency,
            },
            ["capture"] = true,
            ["payment_method_data"] = new JsonObject { ["type"] = "bank_card" },
            ["confirmation"] = new JsonObject
            {
                ["type"]       = "redirect",
                ["return_url"] = request.SuccessUrl,
            },
            ["save_payment_method"] = true,
            ["description"] = description,
            ["metadata"] = new JsonObject { ["user_id"] = request.UserId, ["plan"] = request.Plan.ToString().ToLowerInvariant() },
        };

        using var content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");

        using var req = new HttpRequestMessage(HttpMethod.Post, "/v3/payments") { Content = content };
        // Idempotency-Key is required by YooKassa for all POST requests
        req.Headers.Add("Idempotency-Key", IdGenerator.New().ToString());

        using var response = await _http.SendAsync(req, ct).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("YooKassa payment create failed {Status}: {Body}", (int)response.StatusCode, json);
            throw new InvalidOperationException($"YooKassa payment create failed: {(int)response.StatusCode}");
        }

        using var doc = JsonDocument.Parse(json);
        var confirmationUrl = doc.RootElement
            .GetProperty("confirmation")
            .GetProperty("confirmation_url")
            .GetString();

        return confirmationUrl ?? throw new InvalidOperationException("YooKassa did not return a confirmation URL.");
    }

    /// <summary>YooKassa has no hosted billing portal. Returns null — caller shows own UI.</summary>
    public Task<string?> CreatePortalUrlAsync(string providerCustomerId, string returnUrl, CancellationToken ct = default)
        => Task.FromResult<string?>(null);
}
