namespace Inktide.API.Organization.REST.Models;

public sealed class PendingInvitesResponse
{
    public Guid OrganizationId { get; init; }
    public List<InviteDto> Invites { get; init; } = [];
}
