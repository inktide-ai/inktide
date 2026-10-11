using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Providers.YooKassa;
using Inktide.API.Billing.Infrastructure.Settings;
using Inktide.API.Core.Models;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Inktide.API.Billing.Tests.Providers.YooKassa;

public sealed class YooKassaBillingProviderTests
{
    private static readonly YooKassaSettings Settings = new()
    {
        StarterPriceAmount = "1390.00",
        ProPriceAmount     = "2890.00",
        PriceCurrency      = "RUB",
    };

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken ct)
        {
            Body = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """{"confirmation":{"confirmation_url":"https://yoomoney.ru/checkout"}}""",
                    Encoding.UTF8, "application/json"),
            };
        }
    }

    private static YooKassaBillingProvider Create(HttpMessageHandler handler) =>
        new(new HttpClient(handler) { BaseAddress = new Uri("https://api.yookassa.ru/v3") },
            Settings, new BillingSettings(), NullLogger<YooKassaBillingProvider>.Instance);

    [Fact]
    public void Prices_list_paid_plans_in_the_configured_currency()
    {
        var prices = Create(new CapturingHandler()).Prices;

        Assert.Equal(
            [new PlanPrice(PlanType.Starter, 1390m, "RUB"), new PlanPrice(PlanType.Pro, 2890m, "RUB")],
            prices);
    }

    [Theory]
    [InlineData(PlanType.Starter)]
    [InlineData(PlanType.Pro)]
    public async Task Listed_price_is_what_checkout_charges(PlanType plan)
    {
        var handler  = new CapturingHandler();
        var provider = Create(handler);

        await provider.CreateCheckoutUrlAsync(
            new CreateCheckoutRequest("user-1", "a@b.c", "https://app/success", "https://app", plan));

        using var body = JsonDocument.Parse(handler.Body!);
        var amount     = body.RootElement.GetProperty("amount");
        var listed     = provider.Prices.Single(p => p.Plan == plan);
        Assert.Equal(listed.Amount, decimal.Parse(amount.GetProperty("value").GetString()!, CultureInfo.InvariantCulture));
        Assert.Equal(listed.Currency, amount.GetProperty("currency").GetString());
    }
}
