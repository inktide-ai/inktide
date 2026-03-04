namespace Chimera.Identity.Application.Interfaces.Auth;

/// <summary>Manages the two-step password reset flow: request a reset link, then apply the new password.</summary>
public interface IPasswordResetService
{
    /// <summary>
    /// Generates a password-reset token and sends a reset link to the user's email.
    /// Always returns successfully — does not reveal whether the email is registered (prevents enumeration).
    /// </summary>
    Task RequestResetAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// Validates <paramref name="token"/> and updates the password.
    /// Returns <see langword="false"/> when the token is invalid, expired, or already used.
    /// </summary>
    Task<bool> ResetPasswordAsync(string token, string newPassword, CancellationToken ct = default);
}
