using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Chimera.ApiGateway.Application.Interfaces.Email;
using Chimera.ApiGateway.Application.Models.Email;
using Chimera.ApiGateway.Core.Settings;

namespace Chimera.ApiGateway.Infrastructure.Email;

/// <summary>
/// SMTP email sender backed by <see cref="System.Net.Mail.SmtpClient"/>.
/// For production, replace with MailKit or a cloud provider (SendGrid, AWS SES, Postmark)
/// to get proper DKIM signing, delivery tracking, and bounce handling.
/// </summary>
public sealed class SmtpEmailSender : IEmailSender
{
    #region Fields

    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpEmailSender> _logger;

    #endregion

    #region Constructors

    public SmtpEmailSender(IOptions<SmtpSettings> options, ILogger<SmtpEmailSender> logger)
    {
        _settings = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Public Methods

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            EnableSsl = _settings.EnableSsl,
            Credentials = new NetworkCredential(_settings.Username, _settings.Password),
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 15_000
        };

        using var mail = new MailMessage
        {
            From = new MailAddress(_settings.FromAddress, _settings.FromName),
            Subject = message.Subject,
            IsBodyHtml = true,
            Body = message.HtmlBody
        };

        if (!string.IsNullOrWhiteSpace(message.PlainTextBody))
        {
            mail.AlternateViews.Add(
                AlternateView.CreateAlternateViewFromString(
                    message.PlainTextBody, null, "text/plain"));
        }

        mail.To.Add(message.To);

        _logger.LogInformation(
            "Sending email. To={To} Subject={Subject}",
            message.To, message.Subject);

        await client.SendMailAsync(mail, ct);

        _logger.LogInformation("Email sent. To={To}", message.To);
    }

    #endregion
}
