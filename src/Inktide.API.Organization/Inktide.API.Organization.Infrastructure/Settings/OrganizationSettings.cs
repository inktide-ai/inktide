namespace Inktide.API.Organization.Infrastructure.Settings;

public sealed class OrganizationSettings
{
    public string InviteBaseUrl { get; set; } = "http://localhost:3000";
    public int InviteExpiryDays { get; set; } = 7;
}
