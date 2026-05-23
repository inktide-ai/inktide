using Inktide.API.Core.Generators;
namespace Inktide.API.Organization.Application.Entities;

public sealed class Organization
{
    public Guid Id { get; set; } = IdGenerator.New();
    public string Name { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
