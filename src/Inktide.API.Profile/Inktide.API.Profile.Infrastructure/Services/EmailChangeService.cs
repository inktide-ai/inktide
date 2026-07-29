using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Application.Messages;
using Inktide.API.Profile.Infrastructure.DbContext;
using Inktide.API.Profile.Infrastructure.Settings;
using Inktide.API.Profile.Infrastructure.Templates;
using MailKit.Net.Smtp;
using MailKit.Security;
using MassTransit;
using MimeKit;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class EmailChangeService : IEmailChangeService
{
    private readonly IVerificationCodeGenerator _codeGen;
    private readonly IEmailVerificationStore _store;
    private readonly SmtpSettings _smtp;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ProfileDbContext _db;
    private readonly ILogger<EmailChangeService> _logger;

    public EmailChangeService(
        IVerificationCodeGenerator codeGen,
        IEmailVerificationStore store,
        SmtpSettings smtp,
        IPublishEndpoint publishEndpoint,
        ProfileDbContext db,
        ILogger<EmailChangeService> logger)
    {
        _codeGen         = codeGen         ?? throw new ArgumentNullException(nameof(codeGen));
        _store           = store           ?? throw new ArgumentNullException(nameof(store));
        _smtp            = smtp            ?? throw new ArgumentNullException(nameof(smtp));
        _publishEndpoint = publishEndpoint ?? throw new ArgumentNullException(nameof(publishEndpoint));
        _db              = db              ?? throw new ArgumentNullException(nameof(db));
        _logger          = logger          ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task RequestChangeAsync(string userId, string newEmail, CancellationToken ct = default)
    {
        var code = _codeGen.Generate();
        await _store.StoreAsync(userId, code, newEmail, ct).ConfigureAwait(false);
        await SendCodeAsync(newEmail, code, ct).ConfigureAwait(false);
        _logger.LogInformation("Email change requested for user {UserId} → {EmailDomain}", userId, MaskEmail(newEmail));
    }

    public async Task<string?> VerifyAndChangeAsync(string userId, string code, CancellationToken ct = default)
    {
        var newEmail = await _store.VerifyAndConsumeAsync(userId, code, ct).ConfigureAwait(false);
        if (newEmail is null) return null;

        if (!Guid.TryParse(userId, out var guid))
        {
            _logger.LogWarning("VerifyAndChangeAsync: invalid userId format {UserId}", userId);
            return null;
        }

        // Publish to EF outbox - consumer retries Keycloak update up to 10 times (backoff -> 1h)
        await _publishEndpoint
            .Publish(new KeycloakEmailUpdateRequested(guid, newEmail), ct)
            .ConfigureAwait(false);

        await _db.SaveChangesAsync(ct).ConfigureAwait(false); // flushes outbox row to DB

        _logger.LogInformation("Email change for {UserId} queued for Keycloak update → {EmailDomain}",
            userId, MaskEmail(newEmail));

        return newEmail;
    }

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        return at > 0 ? $"***@{email[(at + 1)..]}" : "***";
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
                await client.AuthenticateAsync(_smtp.Username, _smtp.Password ?? string.Empty, ct).ConfigureAwait(false);
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
