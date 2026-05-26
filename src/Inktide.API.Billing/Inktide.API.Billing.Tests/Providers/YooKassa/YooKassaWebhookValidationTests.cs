using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.Providers.YooKassa;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using StackExchange.Redis;
using Xunit;

namespace Inktide.API.Billing.Tests.Providers.YooKassa;

public sealed class YooKassaWebhookValidationTests
{
    private static YooKassaWebhookProcessor CreateProcessor(string[] allowedIps)
    {
        var settings = new YooKassaSettings { WebhookAllowedIps = allowedIps };
        var redis    = Substitute.For<IConnectionMultiplexer>();
        var subs     = Substitute.For<ISubscriptionRepository>();
        var logger   = NullLogger<YooKassaWebhookProcessor>.Instance;
        return new YooKassaWebhookProcessor(new HttpClient(), settings, subs, redis, TimeProvider.System, logger);
    }

    private static bool Validate(YooKassaWebhookProcessor p, string ip) =>
        p.ValidateSignature(new Dictionary<string, IReadOnlyList<string>>(), [], ip);

    // ── Default CIDR behaviour (WebhookAllowedIps = []) ──────────────────────

    [Theory]
    [InlineData("185.71.76.5",   true)]   // inside 185.71.76.0/27
    [InlineData("185.71.76.0",   true)]   // base address of /27
    [InlineData("185.71.76.31",  true)]   // last address of /27
    [InlineData("185.71.76.32",  false)]  // first address outside /27
    [InlineData("77.75.153.100", true)]   // inside 77.75.153.0/25
    [InlineData("8.8.8.8",       false)]  // public, not YooKassa
    public void DefaultAllowedNetworks_EnforcesYooKassaCidrs(string ip, bool expected)
    {
        var p = CreateProcessor([]);
        Assert.Equal(expected, Validate(p, ip));
    }

    // ── RFC1918/loopback always blocked regardless of allowlist ───────────────

    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("10.0.0.1")]
    [InlineData("172.16.0.1")]
    [InlineData("192.168.1.1")]
    public void BlockedNetworks_AlwaysRejected_EvenIfInAllowlist(string ip)
    {
        // Deliberately include private ranges in the configured allowlist — must still be rejected.
        var p = CreateProcessor([$"{ip}/32"]);
        Assert.False(Validate(p, ip));
    }

    // ── Null IP ───────────────────────────────────────────────────────────────

    [Fact]
    public void NullClientIp_Rejected()
    {
        var p = CreateProcessor([]);
        var result = p.ValidateSignature(new Dictionary<string, IReadOnlyList<string>>(), [], null);
        Assert.False(result);
    }

    // ── Custom allowlist overrides defaults ───────────────────────────────────

    [Fact]
    public void CustomAllowedIps_OverridesDefaults_YooKassaIpRejected()
    {
        var p = CreateProcessor(["1.2.3.4/32"]);
        Assert.False(Validate(p, "185.71.76.5"));  // YooKassa default — not in custom list
    }

    [Fact]
    public void CustomAllowedIps_AcceptsConfiguredRange()
    {
        var p = CreateProcessor(["1.2.3.0/24"]);
        Assert.True(Validate(p, "1.2.3.200"));
    }
}
