namespace Chimera.API.Identify.Application.Models.Email;

/// <summary>Represents a transactional email to be sent via <c>IEmailSender</c>.</summary>
public sealed record EmailMessage(
    string To,
    string Subject,
    string HtmlBody,
    string? PlainTextBody = null);
