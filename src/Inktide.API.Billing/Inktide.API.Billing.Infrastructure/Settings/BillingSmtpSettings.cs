namespace Inktide.API.Billing.Infrastructure.Settings;

public sealed class BillingSmtpSettings
{
    public string Host        { get; init; } = "localhost";
    public int    Port        { get; init; } = 1025;
    public string Username    { get; init; } = string.Empty;
    public string Password    { get; init; } = string.Empty;
    public string FromAddress { get; init; } = "noreply@inktide.app";
    public string FromName    { get; init; } = "Inktide";
}
