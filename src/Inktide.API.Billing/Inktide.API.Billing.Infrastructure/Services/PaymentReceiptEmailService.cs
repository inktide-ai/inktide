using Inktide.API.Billing.Application.Interfaces;
using Inktide.API.Billing.Infrastructure.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Inktide.API.Billing.Infrastructure.Services;

public sealed class PaymentReceiptEmailService : IPaymentReceiptEmailService
{
    private readonly BillingSmtpSettings _smtp;
    private readonly BillingSettings _billing;
    private readonly ILogger<PaymentReceiptEmailService> _logger;

    public PaymentReceiptEmailService(
        BillingSmtpSettings smtp,
        BillingSettings billing,
        ILogger<PaymentReceiptEmailService> logger)
    {
        _smtp    = smtp    ?? throw new ArgumentNullException(nameof(smtp));
        _billing = billing ?? throw new ArgumentNullException(nameof(billing));
        _logger  = logger  ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task SendReceiptAsync(string userEmail, string planName, string provider,
                                       DateTime periodEnd, CancellationToken ct = default)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
            message.To.Add(MailboxAddress.Parse(userEmail));
            message.Subject = "Подписка Inktide активирована";

            var builder = new BodyBuilder { HtmlBody = BuildHtml(planName, provider, periodEnd, _billing.BillingPortalUrl) };
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtp.Host, _smtp.Port,
                _smtp.Port == 465
                    ? SecureSocketOptions.SslOnConnect
                    : SecureSocketOptions.StartTlsWhenAvailable, ct).ConfigureAwait(false);

            if (!string.IsNullOrEmpty(_smtp.Username))
                await client.AuthenticateAsync(_smtp.Username, _smtp.Password, ct).ConfigureAwait(false);

            await client.SendAsync(message, ct).ConfigureAwait(false);
            await client.DisconnectAsync(true, ct).ConfigureAwait(false);

            _logger.LogInformation("Payment receipt sent to {Email} for plan {Plan}", userEmail, planName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send payment receipt to {Email}", userEmail);
        }
    }

    private static string BuildHtml(string planName, string provider, DateTime periodEnd, string billingPortalUrl) => $"""
        <!DOCTYPE html>
        <html lang="ru">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#0a0a0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0e;">
            <tr><td align="center" style="padding:40px 16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="max-width:460px;width:100%;">

                <tr><td style="padding-bottom:24px;text-align:center;">
                  <span style="font-family:Georgia,serif;font-size:26px;font-weight:500;letter-spacing:0.12em;color:#f9fafb;">INKTIDE</span>
                </td></tr>

                <tr><td style="background:#050509;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px 48px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">

                    <tr><td style="padding-bottom:6px;text-align:center;">
                      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;color:#f9fafb;letter-spacing:-0.01em;">Подписка активирована</h1>
                    </td></tr>
                    <tr><td style="padding-bottom:28px;text-align:center;">
                      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.45);">Спасибо за оплату</p>
                    </td></tr>

                    <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-bottom:20px;"></td></tr>

                    <tr><td style="padding-bottom:12px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);">План</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#f9fafb;">{planName}</td>
                      </tr></table>
                    </td></tr>
                    <tr><td style="padding-bottom:12px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);">Способ оплаты</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#f9fafb;">{provider}</td>
                      </tr></table>
                    </td></tr>
                    <tr><td style="padding-bottom:24px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);">Следующее списание</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#f9fafb;">{periodEnd:dd MMMM yyyy}</td>
                      </tr></table>
                    </td></tr>

                    <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-bottom:24px;"></td></tr>

                    <tr><td align="center" style="padding-bottom:28px;">
                      <a href="{billingPortalUrl}"
                         style="display:inline-block;background:#ffffff;color:#0a0a0e;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:100px;">
                        Управлять подпиской
                      </a>
                    </td></tr>

                    <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;font-size:12px;color:rgba(255,255,255,0.35);text-align:center;">
                      Вопросы? <a href="mailto:support@inktide.app" style="color:rgba(255,255,255,0.6);text-decoration:underline;">support@inktide.app</a>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
}
