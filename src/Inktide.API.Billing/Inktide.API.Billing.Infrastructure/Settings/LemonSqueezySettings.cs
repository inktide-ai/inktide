namespace Inktide.API.Billing.Infrastructure.Settings;

public sealed class LemonSqueezySettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string StoreId { get; set; } = string.Empty;
    public string ProVariantId { get; set; } = string.Empty;
    public string WebhookSigningSecret { get; set; } = string.Empty;
    public string SuccessUrl { get; set; } = "http://localhost:3000/billing/success";
    public string CancelUrl { get; set; } = "http://localhost:3000";
}
