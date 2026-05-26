namespace Inktide.API.Organization.Infrastructure.Settings;

public sealed class OrganizationSettings
{
    public string InviteBaseUrl { get; set; } = "http://localhost:3000";
    public int InviteExpiryDays { get; set; } = 7;
    public int InviteMaxAttempts { get; set; } = 10;
    public int InviteAttemptTtlSeconds { get; set; } = 3600;
}
