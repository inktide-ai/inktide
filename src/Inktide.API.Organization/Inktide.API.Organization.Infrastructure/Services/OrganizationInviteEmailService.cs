using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Infrastructure.Settings;
using Inktide.API.Organization.Infrastructure.Templates;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Inktide.API.Organization.Infrastructure.Services;

public sealed class OrganizationInviteEmailService : IOrganizationInviteEmailService
{
    private readonly OrganizationSmtpSettings _smtp;
    private readonly OrganizationSettings _settings;

    public OrganizationInviteEmailService(
        OrganizationSmtpSettings smtp,
        OrganizationSettings settings)
    {
        _smtp     = smtp;
        _settings = settings;
    }

    public async Task SendInviteEmailAsync(
        string toEmail,
        string organizationName,
        string token,
        CancellationToken ct = default)
    {
        var inviteUrl = $"{_settings.InviteBaseUrl.TrimEnd('/')}/invite/{token}";

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
        msg.To.Add(new MailboxAddress(string.Empty, toEmail));
        msg.Subject = $"You've been invited to join {organizationName} on Inktide";
        msg.Body = new TextPart("html")
        {
            Text = EmailTemplates.InviteEmail(organizationName, inviteUrl, _settings.InviteExpiryDays),
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.Auto, ct);
        if (!string.IsNullOrWhiteSpace(_smtp.Username))
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password, ct);
        await client.SendAsync(msg, ct);
        await client.DisconnectAsync(true, ct);
    }
}
