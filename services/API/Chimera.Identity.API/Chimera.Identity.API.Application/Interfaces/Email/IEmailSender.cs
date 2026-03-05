using Chimera.Identity.Application.Models.Email;

namespace Chimera.Identity.Application.Interfaces.Email;

/// <summary>Sends transactional emails. Swap the implementation for any provider (SMTP, SendGrid, SES) without touching business logic.</summary>
public interface IEmailSender
{
    /// <summary>Sends <paramref name="message"/>. Throws on delivery failure.</summary>
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
}
