using System.Globalization;
using System.Web;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Providers.Robokassa;
using Inktide.API.Billing.Infrastructure.Settings;
using Inktide.API.Core.Models;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Inktide.API.Billing.Tests.Providers.Robokassa;

public sealed class RobokassaBillingProviderTests
{
    private static RobokassaBillingProvider Create() =>
        new(new RobokassaSettings
            {
                MerchantLogin = "shop",
                Password1     = "p1",
                StarterOutSum = "1390.00",
                ProOutSum     = "2890.00",
            },
            NullLogger<RobokassaBillingProvider>.Instance);

    [Fact]
    public void Prices_list_paid_plans_in_rubles()
    {
        Assert.Equal(
            [new PlanPrice(PlanType.Starter, 1390m, "RUB"), new PlanPrice(PlanType.Pro, 2890m, "RUB")],
            Create().Prices);
    }

    [Theory]
    [InlineData(PlanType.Starter)]
    [InlineData(PlanType.Pro)]
    public async Task Listed_price_is_what_checkout_charges(PlanType plan)
    {
        var provider = Create();

        var url = await provider.CreateCheckoutUrlAsync(
            new CreateCheckoutRequest("user-1", "a@b.c", "https://app/success", "https://app", plan));

        var outSum = HttpUtility.ParseQueryString(new Uri(url).Query)["OutSum"]!;
        Assert.Equal(provider.Prices.Single(p => p.Plan == plan).Amount, decimal.Parse(outSum, CultureInfo.InvariantCulture));
    }
}
