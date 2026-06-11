using System.Text;
using System.Web;
using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Application.Models;
using Inktide.API.Core.Models;
using Inktide.API.Billing.Infrastructure.Settings;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Billing.Infrastructure.Providers.Robokassa;

public sealed class RobokassaBillingProvider : IBillingProvider
{
    public string ProviderId => "robokassa";

    private const string CheckoutBaseUrl = "https://auth.robokassa.kz/Merchant/Index.aspx";

    private readonly RobokassaSettings _settings;
    private readonly ILogger<RobokassaBillingProvider> _logger;

    public RobokassaBillingProvider(
        RobokassaSettings settings,
        ILogger<RobokassaBillingProvider> logger)
    {
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task<string> CreateCheckoutUrlAsync(CreateCheckoutRequest request, CancellationToken ct = default)
    {
        // Pass 0 so Robokassa auto-assigns a unique InvId (avoids 31-bit birthday-paradox collisions).
        // User correlation is handled via Shp_UserId embedded in the signature; InvId is not
        // used in RobokassaWebhookProcessor.
        const int invId = 0;

        var isStarter = request.Plan == PlanType.Starter;
        var outSum      = isStarter ? _settings.StarterOutSum      : _settings.ProOutSum;
        var description = isStarter ? _settings.StarterDescription : _settings.ProDescription;

        // Shp_* params must be included in signature in alphabetical order (Email < Plan < UserId).
        var shpEmail  = request.UserEmail;
        var shpPlan   = request.Plan.ToString().ToLowerInvariant();
        var shpUserId = request.UserId;
        var shpParams = $"Shp_Email={shpEmail}:Shp_Plan={shpPlan}:Shp_UserId={shpUserId}";

        var signatureInput = $"{_settings.MerchantLogin}:{outSum}:{invId}:{_settings.Password1}:{shpParams}";
        var signature      = RobokassaSignature.ComputeMd5Hex(signatureInput);

        var qs = HttpUtility.ParseQueryString(string.Empty);
        qs["MerchantLogin"]  = _settings.MerchantLogin;
        qs["OutSum"]         = outSum;
        qs["InvId"]          = invId.ToString();
        qs["Description"]    = description;
        qs["SignatureValue"] = signature;
        qs["Shp_Email"]      = shpEmail;
        qs["Shp_Plan"]       = shpPlan;
        qs["Shp_UserId"]     = shpUserId;
        qs["Culture"]        = "ru";
        if (_settings.IsTest)
            qs["IsTest"] = "1";

        var url = $"{CheckoutBaseUrl}?{qs}";

        _logger.LogInformation("Robokassa checkout created for user {UserId}, InvId={InvId}", request.UserId, invId);
        return Task.FromResult(url);
    }

    public Task<string?> CreatePortalUrlAsync(string providerCustomerId, string returnUrl, CancellationToken ct = default)
        => Task.FromResult<string?>(null);

}
