using Inktide.API.Profile.Application.Messages;
using Inktide.API.Profile.Infrastructure.Keycloak;
using Inktide.API.Profile.Infrastructure.Settings;
using Inktide.API.Profile.Infrastructure.Templates;
using MailKit.Net.Smtp;
using MailKit.Security;
using MassTransit;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Inktide.API.Profile.Infrastructure.Messaging;

public sealed class KeycloakEmailUpdateConsumer(
    IKeycloakAdminClient keycloak,
    ILogger<KeycloakEmailUpdateConsumer> logger) : IConsumer<KeycloakEmailUpdateRequested>
{
    public async Task Consume(ConsumeContext<KeycloakEmailUpdateRequested> context)
    {
        var (userId, newEmail) = context.Message;
        var ct = context.CancellationToken;

        var (ok, err) = await keycloak.TryUpdateUserEmailAsync(userId, newEmail, ct).ConfigureAwait(false);
        if (ok)
        {
            logger.LogInformation("Keycloak email updated for {UserId} → {EmailDomain}",
                userId, MaskEmail(newEmail));
            return;
        }

        throw new KeycloakOperationException(
            $"Failed to update Keycloak email for {userId}: {err}");
    }

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        return at > 0 ? $"***@{email[(at + 1)..]}" : "***";
    }
}

/// <summary>
/// Handles exhausted retries for <see cref="KeycloakEmailUpdateRequested"/>.
/// Notifies the user that their email change failed and they should retry.
/// </summary>
public sealed class KeycloakEmailUpdateFaultConsumer(
    SmtpSettings smtp,
    ILogger<KeycloakEmailUpdateFaultConsumer> logger) : IConsumer<Fault<KeycloakEmailUpdateRequested>>
{
    public async Task Consume(ConsumeContext<Fault<KeycloakEmailUpdateRequested>> context)
    {
        var msg     = context.Message.Message;
        var newEmail = msg.NewEmail;
        var ct      = context.CancellationToken;

        logger.LogWarning(
            "Email change for user {UserId} exhausted all retries — notifying {EmailDomain}",
            msg.UserId, MaskEmail(newEmail));

        try
        {
            await SendFailureEmailAsync(newEmail, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email-change failure notification to {EmailDomain}",
                MaskEmail(newEmail));
        }
    }

    private async Task SendFailureEmailAsync(string toEmail, CancellationToken ct)
    {
        var mimeMsg = new MimeMessage();
        mimeMsg.From.Add(new MailboxAddress(smtp.FromName, smtp.FromAddress));
        mimeMsg.To.Add(new MailboxAddress(string.Empty, toEmail));
        mimeMsg.Subject = "Your email change could not be completed";
        mimeMsg.Body = new TextPart("html")
        {
            Text = EmailChangeFailedTemplate.Build()
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtp.Host, smtp.Port, SecureSocketOptions.Auto, ct).ConfigureAwait(false);
        if (!string.IsNullOrWhiteSpace(smtp.Username))
            await client.AuthenticateAsync(smtp.Username, smtp.Password, ct).ConfigureAwait(false);
        await client.SendAsync(mimeMsg, ct).ConfigureAwait(false);
        await client.DisconnectAsync(true, ct).ConfigureAwait(false);
    }

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        return at > 0 ? $"***@{email[(at + 1)..]}" : "***";
    }
}
