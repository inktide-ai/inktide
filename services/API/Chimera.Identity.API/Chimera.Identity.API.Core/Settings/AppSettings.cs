namespace Chimera.Identity.API.Core.Settings;

/// <summary>General application settings (frontend URL, token lifetimes for non-auth flows).</summary>
public sealed class AppSettings
{
    private string _frontendBaseUrl = "http://localhost:3000";
    private int _passwordResetTokenMinutes = 60;

    /// <summary>
    /// Base URL of the frontend app. Used to build links in emails
    /// (e.g. <c>{FrontendBaseUrl}/reset-password?token=...</c>).
    /// </summary>
    public string FrontendBaseUrl
    {
        get => _frontendBaseUrl;
        set => _frontendBaseUrl = value;
    }

    /// <summary>How long a password-reset token stays valid. Default: 60 minutes.</summary>
    public int PasswordResetTokenMinutes
    {
        get => _passwordResetTokenMinutes;
        set => _passwordResetTokenMinutes = value;
    }
}
