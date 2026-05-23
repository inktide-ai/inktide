namespace Inktide.API.Profile.Infrastructure.Settings;

public sealed class SmtpSettings
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string FromAddress { get; set; } = "noreply@inktide.local";
    public string FromName { get; set; } = "Inktide";
}
