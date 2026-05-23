namespace Inktide.API.Billing.Infrastructure.Settings;

public sealed class YooKassaSettings
{
    public string ShopId { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string PriceAmount { get; set; } = "299.00";
    public string PriceCurrency { get; set; } = "RUB";
    public string Description { get; set; } = "Inktide Pro — 1 месяц";
    /// <summary>YooKassa outbound IP allowlist. Empty = disabled (dev/test). Configure in production from https://yookassa.ru/developers/using-api/webhooks</summary>
    public string[] WebhookAllowedIps { get; set; } = [];
}
