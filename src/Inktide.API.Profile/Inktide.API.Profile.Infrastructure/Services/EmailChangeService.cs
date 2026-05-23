using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Infrastructure.Keycloak;
using Inktide.API.Profile.Infrastructure.Settings;
using Inktide.API.Profile.Infrastructure.Templates;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class EmailChangeService : IEmailChangeService
{
    private readonly IVerificationCodeGenerator _codeGen;
    private readonly IEmailVerificationStore _store;
    private readonly SmtpSettings _smtp;
    private readonly IKeycloakAdminClient _keycloak;
    private readonly ILogger<EmailChangeService> _logger;

    public EmailChangeService(
        IVerificationCodeGenerator codeGen,
        IEmailVerificationStore store,
        SmtpSettings smtp,
        IKeycloakAdminClient keycloak,
        ILogger<EmailChangeService> logger)
    {
        _codeGen  = codeGen  ?? throw new ArgumentNullException(nameof(codeGen));
        _store    = store    ?? throw new ArgumentNullException(nameof(store));
        _smtp     = smtp     ?? throw new ArgumentNullException(nameof(smtp));
        _keycloak = keycloak ?? throw new ArgumentNullException(nameof(keycloak));
        _logger   = logger   ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task RequestChangeAsync(string userId, string newEmail, CancellationToken ct = default)
    {
        var code = _codeGen.Generate();
        await _store.StoreAsync(userId, code, newEmail, ct).ConfigureAwait(false);
        await SendCodeAsync(newEmail, code, ct).ConfigureAwait(false);
        _logger.LogInformation("Email change requested for user {UserId} → {Email}", userId, newEmail);
    }

    public async Task<string?> VerifyAndChangeAsync(string userId, string code, CancellationToken ct = default)
    {
        var newEmail = await _store.VerifyAndConsumeAsync(userId, code, ct).ConfigureAwait(false);
        if (newEmail is null) return null;

        if (Guid.TryParse(userId, out var guid))
        {
            var (ok, err) = await _keycloak.TryUpdateUserEmailAsync(guid, newEmail, ct).ConfigureAwait(false);
            if (!ok)
            {
                _logger.LogWarning("Failed to update Keycloak email for {UserId}: {Error}", userId, err);
                return null;
            }
        }

        return newEmail;
    }

    private async Task SendCodeAsync(string toEmail, string code, CancellationToken ct)
    {
        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
        msg.To.Add(new MailboxAddress(string.Empty, toEmail));
        msg.Subject = "Your email verification code";
        msg.Body = new TextPart("html") { Text = EmailChangeTemplate.Build(code) };

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.Auto, ct).ConfigureAwait(false);
            if (!string.IsNullOrWhiteSpace(_smtp.Username))
                await client.AuthenticateAsync(_smtp.Username, _smtp.Password, ct).ConfigureAwait(false);
            await client.SendAsync(msg, ct).ConfigureAwait(false);
            await client.DisconnectAsync(true, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", toEmail);
            throw;
        }
    }
}
