using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Chimera.Identity.Application.Interfaces.Auth;
using Chimera.Identity.Application.Interfaces.Email;
using Chimera.Identity.Application.Models.Email;
using Chimera.Identity.API.Core.Settings;
using Chimera.Identity.Domain.Repositories;

namespace Chimera.Identity.Application.Services;

/// <summary>
/// Implements the password-reset flow:
/// <list type="number">
///   <item>User submits their email → a time-limited token is sent by email.</item>
///   <item>User submits token + new password → password is updated and token is consumed.</item>
/// </list>
/// </summary>
public sealed class PasswordResetService : IPasswordResetService
{
    #region Fields

    private readonly IUserRepository _userRepository;
    private readonly IPasswordResetStore _resetStore;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<PasswordResetService> _logger;
    private readonly AppSettings _appSettings;
    private readonly AuthSettings _authSettings;

    #endregion

    #region Constructors

    public PasswordResetService(
        IUserRepository userRepository,
        IPasswordResetStore resetStore,
        IPasswordHasher passwordHasher,
        IEmailSender emailSender,
        IOptions<AppSettings> appOptions,
        IOptions<AuthSettings> authOptions,
        ILogger<PasswordResetService> logger)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _resetStore = resetStore ?? throw new ArgumentNullException(nameof(resetStore));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        _emailSender = emailSender ?? throw new ArgumentNullException(nameof(emailSender));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _appSettings = appOptions?.Value ?? throw new ArgumentNullException(nameof(appOptions));
        _authSettings = authOptions?.Value ?? throw new ArgumentNullException(nameof(authOptions));
    }

    #endregion

    #region Public Methods

    /// <inheritdoc/>
    public async Task RequestResetAsync(string email, CancellationToken ct = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalized, ct);

        if (user is null)
        {
            // Do not reveal whether the email is registered.
            _logger.LogInformation("Password reset requested for unknown email. Email={Email}", normalized);
            return;
        }

        var lifetime = TimeSpan.FromMinutes(_appSettings.PasswordResetTokenMinutes);
        var token = await _resetStore.CreateAsync(user.Id.ToString(), lifetime, ct);

        var resetUrl = $"{_appSettings.FrontendBaseUrl.TrimEnd('/')}/reset-password?token={token}";

        var message = BuildResetEmail(user.Email, resetUrl, _appSettings.PasswordResetTokenMinutes);

        try
        {
            await _emailSender.SendAsync(message, ct);
        }
        catch (Exception ex)
        {
            // Log but don't expose email delivery errors to the caller.
            _logger.LogError(ex, "Failed to send password reset email. UserId={UserId}", user.Id);
        }

        _logger.LogInformation("Password reset token issued. UserId={UserId}", user.Id);
    }

    /// <inheritdoc/>
    public async Task<bool> ResetPasswordAsync(string token, string newPassword, CancellationToken ct = default)
    {
        var userId = await _resetStore.ConsumeAsync(token, ct);
        if (userId is null)
        {
            return false;
        }

        if (!Guid.TryParse(userId, out var userGuid))
        {
            _logger.LogWarning("Password reset token contained invalid userId. RawValue={UserId}", userId);
            return false;
        }

        var newHash = _passwordHasher.Hash(newPassword);
        var updated = await _userRepository.UpdatePasswordHashAsync(userGuid, newHash, ct);

        if (!updated)
        {
            _logger.LogWarning("Password reset failed — user not found or inactive. UserId={UserId}", userId);
            return false;
        }

        _logger.LogInformation("Password successfully reset. UserId={UserId}", userId);
        return true;
    }

    #endregion

    #region Private Methods

    private static EmailMessage BuildResetEmail(string toAddress, string resetUrl, int expiryMinutes)
    {
        var subject = "Reset your Chimera password";

        var html = $"""
            <div style="font-family:sans-serif;max-width:480px;margin:auto;">
              <h2>Password Reset</h2>
              <p>We received a request to reset the password for your account.</p>
              <p>
                <a href="{resetUrl}"
                   style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;
                          border-radius:6px;text-decoration:none;font-weight:600;">
                  Reset Password
                </a>
              </p>
              <p style="color:#666;font-size:13px;">
                This link expires in {expiryMinutes} minutes.
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </div>
            """;

        var plain = $"""
            Reset your Chimera password

            Visit the following URL to reset your password (expires in {expiryMinutes} minutes):
            {resetUrl}

            If you did not request this, ignore this email.
            """;

        return new EmailMessage(toAddress, subject, html, plain);
    }

    #endregion
}
