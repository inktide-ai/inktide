namespace Inktide.API.Billing.Infrastructure.Settings;

public sealed class RobokassaSettings
{
    public string MerchantLogin      { get; init; } = string.Empty;
    /// <summary>Password #1 - used to sign outgoing checkout URLs.</summary>
    public string Password1          { get; init; } = string.Empty;
    /// <summary>Password #2 - used to validate incoming webhook signatures.</summary>
    public string Password2          { get; init; } = string.Empty;
    public string StarterOutSum      { get; init; } = "1390.00";
    public string ProOutSum          { get; init; } = "2890.00";
    /// <summary>Currency of the OutSum amounts (the shop's currency); shown next to the prices.</summary>
    public string PriceCurrency      { get; init; } = "RUB";
    public string StarterDescription { get; init; } = "Inktide Starter — 1 месяц";
    public string ProDescription     { get; init; } = "Inktide Pro — 1 месяц";
    public bool   IsTest             { get; init; } = true;
}
