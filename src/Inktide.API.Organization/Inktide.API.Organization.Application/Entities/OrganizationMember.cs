using Inktide.API.Core.Generators;
using Inktide.API.Organization.Application.Enums;

namespace Inktide.API.Organization.Application.Entities;

public sealed class OrganizationMember
{
    public Guid Id { get; set; } = IdGenerator.New();
    public Guid OrganizationId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public OrganizationRole Role { get; set; } = OrganizationRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Organization Organization { get; set; } = null!;
}
