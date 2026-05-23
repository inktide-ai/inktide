namespace Inktide.API.Organization.REST.Models;

public sealed class AcceptInviteResponse
{
    public string Result { get; init; } = string.Empty;
    public Guid? OrganizationId { get; init; }
    public string? OrganizationName { get; init; }
}
