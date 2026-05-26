namespace Inktide.API.Billing.Infrastructure.Settings;

public sealed class StripeSettings
{
    public string SecretKey     { get; init; } = string.Empty;
    public string WebhookSecret { get; init; } = string.Empty;
}
