using System.Security.Cryptography;
using System.Text;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.DbContext;
using Inktide.API.Billing.Infrastructure.Providers.Robokassa;
using Inktide.API.Billing.Infrastructure.Settings;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using StackExchange.Redis;
using Xunit;

namespace Inktide.API.Billing.Tests.Providers.Robokassa;

public sealed class RobokassaWebhookValidationTests
{
    private const string Password2 = "test_password2";
    private const string OutSum    = "299.00";
    private const string InvId     = "12345";
    private const string UserId    = "user-abc";
    private const string Plan      = "pro";

    private static RobokassaWebhookProcessor CreateProcessor(string password2 = Password2)
    {
        var settings  = new RobokassaSettings { Password2 = password2 };
        var redis     = Substitute.For<IConnectionMultiplexer>();
        var subs      = Substitute.For<ISubscriptionRepository>();
        var publish   = Substitute.For<IPublishEndpoint>();
        var db        = new BillingDbContext(new DbContextOptionsBuilder<BillingDbContext>()
                            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var logger    = NullLogger<RobokassaWebhookProcessor>.Instance;
        return new RobokassaWebhookProcessor(settings, subs, publish, db, redis, TimeProvider.System, logger);
    }

    private static byte[] BuildForm(string outSum, string invId, string userId, string sig, string plan = Plan)
    {
        var form = $"OutSum={outSum}&InvId={invId}&Shp_Plan={plan}&Shp_UserId={userId}&SignatureValue={sig}";
        return Encoding.UTF8.GetBytes(form);
    }

    private static string ComputeSig(string outSum, string invId, string password2, string userId, string plan = Plan)
    {
        var input = $"{outSum}:{invId}:{password2}:Shp_Plan={plan}:Shp_UserId={userId}";
        var hash  = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash).ToUpperInvariant();
    }

    [Fact]
    public void ValidSignature_Accepted()
    {
        var p   = CreateProcessor();
        var sig = ComputeSig(OutSum, InvId, Password2, UserId);
        var raw = BuildForm(OutSum, InvId, UserId, sig);

        Assert.True(p.ValidateSignature(new Dictionary<string, IReadOnlyList<string>>(), raw, "1.2.3.4"));
    }

    [Fact]
    public void WrongPassword2_Rejected()
    {
        var p   = CreateProcessor("wrong_password");
        var sig = ComputeSig(OutSum, InvId, Password2, UserId); // signed with correct Password2
        var raw = BuildForm(OutSum, InvId, UserId, sig);

        Assert.False(p.ValidateSignature(new Dictionary<string, IReadOnlyList<string>>(), raw, "1.2.3.4"));
    }

    [Fact]
    public void SignatureIsCaseInsensitive()
    {
        var p   = CreateProcessor();
        var sig = ComputeSig(OutSum, InvId, Password2, UserId).ToLowerInvariant();
        var raw = BuildForm(OutSum, InvId, UserId, sig);

        Assert.True(p.ValidateSignature(new Dictionary<string, IReadOnlyList<string>>(), raw, "1.2.3.4"));
    }

    [Fact]
    public void MissingSignatureValue_Rejected()
    {
        var p   = CreateProcessor();
        var raw = Encoding.UTF8.GetBytes($"OutSum={OutSum}&InvId={InvId}&Shp_Plan={Plan}&Shp_UserId={UserId}");

        Assert.False(p.ValidateSignature(new Dictionary<string, IReadOnlyList<string>>(), raw, "1.2.3.4"));
    }

    [Fact]
    public void MissingShpUserId_Rejected()
    {
        var p   = CreateProcessor();
        var sig = ComputeSig(OutSum, InvId, Password2, UserId);
        var raw = Encoding.UTF8.GetBytes($"OutSum={OutSum}&InvId={InvId}&Shp_Plan={Plan}&SignatureValue={sig}");

        Assert.False(p.ValidateSignature(new Dictionary<string, IReadOnlyList<string>>(), raw, "1.2.3.4"));
    }

    [Fact]
    public void TamperedOutSum_Rejected()
    {
        var p   = CreateProcessor();
        var sig = ComputeSig(OutSum, InvId, Password2, UserId);
        var raw = BuildForm("1.00", InvId, UserId, sig); // tampered amount

        Assert.False(p.ValidateSignature(new Dictionary<string, IReadOnlyList<string>>(), raw, "1.2.3.4"));
    }
}
