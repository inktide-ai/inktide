namespace Inktide.API.Organization.Application.Interfaces;

public interface IOrganizationInviteEmailService
{
    Task SendInviteEmailAsync(
        string toEmail,
        string organizationName,
        string token,
        CancellationToken ct = default);
}
