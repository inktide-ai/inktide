using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Billing.Infrastructure.Services;
using Inktide.API.Core.Contracts;
using NSubstitute;
using Xunit;

namespace Inktide.API.Billing.Tests.Services;

public sealed class PlanLimitResolverTests
{
    private static ISubscriptionService BuildService(PlanType plan)
    {
        var svc = Substitute.For<ISubscriptionService>();
        svc.GetSubscriptionAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
           .Returns(new SubscriptionDto("user-1", plan, SubStatus.Active, null, null));
        return svc;
    }

    [Fact]
    public async Task Free_subscription_returns_free_limits()
    {
        var resolver = new PlanLimitResolver(BuildService(PlanType.Free));
        var limits = await resolver.GetLimitsAsync("user-1");
        Assert.Equal(PlanLimits.Free, limits);
    }

    [Fact]
    public async Task Starter_subscription_returns_starter_limits()
    {
        var resolver = new PlanLimitResolver(BuildService(PlanType.Starter));
        var limits = await resolver.GetLimitsAsync("user-1");
        Assert.Equal(PlanLimits.Starter, limits);
    }

    [Fact]
    public async Task Pro_subscription_returns_pro_limits()
    {
        var resolver = new PlanLimitResolver(BuildService(PlanType.Pro));
        var limits = await resolver.GetLimitsAsync("user-1");
        Assert.Equal(PlanLimits.Pro, limits);
    }

    [Fact]
    public async Task Free_plan_returns_free_limits()
    {
        var resolver = new PlanLimitResolver(BuildService(PlanType.Free));
        var limits = await resolver.GetLimitsAsync("user-1");

        Assert.Equal(1, limits.MaxSoulCards);
        Assert.Equal(1, limits.MaxChannelsPerCard);
    }
}
