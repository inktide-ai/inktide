namespace Inktide.API.Billing.Infrastructure.Settings;

public sealed class YooKassaSettings
{
    public string   ShopId             { get; init; } = string.Empty;
    public string   SecretKey          { get; init; } = string.Empty;
    public string   StarterPriceAmount { get; init; } = "199.00";
    public string   ProPriceAmount     { get; init; } = "299.00";
    public string   PriceCurrency      { get; init; } = "RUB";
    public string   StarterDescription { get; init; } = "Inktide Starter — 1 месяц";
    public string   ProDescription     { get; init; } = "Inktide Pro — 1 месяц";
    /// <summary>YooKassa outbound IP allowlist. Empty = use published defaults. Configure in production from https://yookassa.ru/developers/using-api/webhooks</summary>
    public string[] WebhookAllowedIps  { get; init; } = [];
}
