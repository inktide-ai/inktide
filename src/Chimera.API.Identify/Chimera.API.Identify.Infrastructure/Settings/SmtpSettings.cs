namespace Chimera.API.Identify.Infrastructure.Settings;

/// <summary>
/// SMTP configuration for transactional email (password reset, notifications).
/// In production prefer a cloud provider (SendGrid, AWS SES, Postmark) over raw SMTP.
/// </summary>
public sealed class SmtpSettings
{
    private string _host = "localhost";
    private int _port = 587;
    private string _username = string.Empty;
    private string _password = string.Empty;
    private string _fromAddress = "noreply@chimera.local";
    private string _fromName = "Chimera";
    private bool _enableSsl = true;

    /// <summary>SMTP host (e.g. smtp.sendgrid.net).</summary>
    public string Host
    {
        get => _host;
        set => _host = value;
    }

    /// <summary>SMTP port. 587 = STARTTLS, 465 = SSL/TLS, 25 = unencrypted (avoid in prod).</summary>
    public int Port
    {
        get => _port;
        set => _port = value;
    }

    /// <summary>SMTP login username or API key (provider-specific).</summary>
    public string Username
    {
        get => _username;
        set => _username = value;
    }

    /// <summary>SMTP password or API key. Load from env / secrets — never commit.</summary>
    public string Password
    {
        get => _password;
        set => _password = value;
    }

    /// <summary>From address shown to recipients.</summary>
    public string FromAddress
    {
        get => _fromAddress;
        set => _fromAddress = value;
    }

    /// <summary>From display name shown to recipients.</summary>
    public string FromName
    {
        get => _fromName;
        set => _fromName = value;
    }

    /// <summary>Whether to use SSL/TLS. Default true.</summary>
    public bool EnableSsl
    {
        get => _enableSsl;
        set => _enableSsl = value;
    }
}
