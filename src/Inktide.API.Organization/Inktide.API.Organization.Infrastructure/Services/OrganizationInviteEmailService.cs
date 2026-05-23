using Inktide.API.Organization.Application.Interfaces;
using Inktide.API.Organization.Infrastructure.Settings;
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
            Text = $"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:40px 16px;">
                    <tr><td align="center">
                      <table width="520" cellpadding="0" cellspacing="0" style="background:#111113;border-radius:12px;border:1px solid #27272a;padding:40px;">
                        <tr><td style="padding-bottom:28px;">
                          <span style="font-size:20px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">Inktide</span>
                        </td></tr>
                        <tr><td>
                          <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#ffffff;line-height:1.3;">
                            You're invited to join <em style="font-style:normal;color:#a78bfa;">{organizationName}</em>
                          </h1>
                          <p style="margin:0 0 32px;font-size:14px;line-height:1.7;color:#a1a1aa;">
                            Someone on the Inktide platform has invited you to collaborate in their workspace.
                            Click the button below to accept. This invitation expires in {_settings.InviteExpiryDays} days.
                          </p>
                          <a href="{inviteUrl}"
                             style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:600;
                                    padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
                            Accept Invitation
                          </a>
                          <p style="margin:32px 0 0;font-size:12px;color:#52525b;border-top:1px solid #27272a;padding-top:20px;line-height:1.6;">
                            If you weren't expecting this invitation, you can safely ignore this email.<br/>
                            Or copy this link directly:
                            <span style="color:#a78bfa;word-break:break-all;">{inviteUrl}</span>
                          </p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """,
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.Auto, ct);
        if (!string.IsNullOrWhiteSpace(_smtp.Username))
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password, ct);
        await client.SendAsync(msg, ct);
        await client.DisconnectAsync(true, ct);
    }
}
