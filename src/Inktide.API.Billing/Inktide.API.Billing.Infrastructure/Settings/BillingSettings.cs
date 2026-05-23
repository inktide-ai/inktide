namespace Inktide.API.Billing.Infrastructure.Settings;

public sealed class BillingSettings
{
    /// <summary>"yookassa" | "lemon_squeezy"</summary>
    public string ActiveProvider { get; set; } = "yookassa";
    public string SuccessUrl { get; set; } = "http://localhost:3000/billing/success";
    public string CancelUrl { get; set; } = "http://localhost:3000";
}
