namespace Inktide.API.Billing.Infrastructure.Settings;

public sealed class BillingSettings
{
    /// <summary>"yookassa" | "robokassa" | "stripe"</summary>
    public string ActiveProvider  { get; init; } = "yookassa";
    public string SuccessUrl      { get; init; } = "http://localhost:3000/billing/success";
    public string CancelUrl       { get; init; } = "http://localhost:3000";
    public string BillingPortalUrl{ get; init; } = "https://inktide.app/billing";
}
