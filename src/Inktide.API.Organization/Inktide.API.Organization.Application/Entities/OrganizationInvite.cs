using Inktide.API.Core.Generators;
using Inktide.API.Organization.Application.Enums;

namespace Inktide.API.Organization.Application.Entities;

public sealed class OrganizationInvite
{
    public Guid Id { get; set; } = IdGenerator.New();
    public Guid OrganizationId { get; set; }
    public string Email { get; set; } = string.Empty;
    public OrganizationRole Role { get; set; } = OrganizationRole.Member;
    public string Token { get; set; } = string.Empty;
    public string InvitedBy { get; set; } = string.Empty;
    public InviteStatus Status { get; set; } = InviteStatus.Pending;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization Organization { get; set; } = null!;
}
