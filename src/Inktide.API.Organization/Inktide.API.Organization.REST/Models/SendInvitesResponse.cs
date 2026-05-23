namespace Inktide.API.Organization.REST.Models;

public sealed class SendInvitesResponse
{
    public Guid OrganizationId { get; init; }
    public List<InviteDto> Invites { get; init; } = [];
}
