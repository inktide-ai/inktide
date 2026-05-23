using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.Infrastructure.Providers.LemonSqueezy;

public sealed class LemonSqueezyBillingProvider : IBillingProvider
{
    public string ProviderId => "lemon_squeezy";

    private const string BaseUrl = "https://api.lemonsqueezy.com/v1";
    private readonly LemonSqueezySettings _settings;
    private readonly HttpClient _http;
    private readonly ILogger<LemonSqueezyBillingProvider> _logger;

    public LemonSqueezyBillingProvider(
        HttpClient http,
        LemonSqueezySettings settings,
        ILogger<LemonSqueezyBillingProvider> logger)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<string> CreateCheckoutUrlAsync(CreateCheckoutRequest request, CancellationToken ct = default)
    {
        var body = new JsonObject
        {
            ["data"] = new JsonObject
            {
                ["type"] = "checkouts",
                ["attributes"] = new JsonObject
                {
                    ["checkout_options"] = new JsonObject
                    {
                        ["embed"] = false,
                        ["media"] = false,
                    },
                    ["checkout_data"] = new JsonObject
                    {
                        ["email"] = request.UserEmail,
                        ["custom"] = new JsonObject { ["user_id"] = request.UserId },
                    },
                    ["product_options"] = new JsonObject
                    {
                        ["redirect_url"] = request.SuccessUrl,
                    },
                    ["expires_at"] = null,
                },
                ["relationships"] = new JsonObject
                {
                    ["store"] = new JsonObject
                    {
                        ["data"] = new JsonObject { ["type"] = "stores", ["id"] = _settings.StoreId },
                    },
                    ["variant"] = new JsonObject
                    {
                        ["data"] = new JsonObject { ["type"] = "variants", ["id"] = _settings.ProVariantId },
                    },
                },
            },
        };

        using var content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/vnd.api+json");
        using var response = await _http.PostAsync("/v1/checkouts", content, ct).ConfigureAwait(false);

        var json = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("LemonSqueezy checkout failed {Status}: {Body}", (int)response.StatusCode, json);
            throw new InvalidOperationException($"LemonSqueezy checkout failed: {(int)response.StatusCode}");
        }

        using var doc = JsonDocument.Parse(json);
        var url = doc.RootElement
            .GetProperty("data")
            .GetProperty("attributes")
            .GetProperty("url")
            .GetString();

        return url ?? throw new InvalidOperationException("LemonSqueezy did not return a checkout URL.");
    }

    public async Task<string?> CreatePortalUrlAsync(
        string providerCustomerId,
        string returnUrl,
        CancellationToken ct = default)
    {
        // LemonSqueezy customer portal URL format
        var url = $"https://app.lemonsqueezy.com/billing?customer={providerCustomerId}";
        await Task.CompletedTask;
        return url;
    }
}
