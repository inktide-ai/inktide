namespace Inktide.API.Organization.REST.Models;

public sealed class SendInvitesRequest
{
    public List<string> Emails { get; init; } = [];
    public string Role { get; init; } = "member";
}
