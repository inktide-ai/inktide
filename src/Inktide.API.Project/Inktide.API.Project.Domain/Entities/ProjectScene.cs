namespace Inktide.API.Project.Domain.Entities;

public sealed class ProjectScene
{
    public Guid    Id           { get; set; }
    public Guid    ProjectId    { get; set; }
    public string  StorageKey   { get; set; } = string.Empty;
    public string? PublicUrl    { get; set; }
    public string? OriginalName { get; set; }
    public string? ContentType  { get; set; }
    public long?   SizeBytes    { get; set; }
    public string? DisplayName  { get; set; }
    public string? Description  { get; set; }
    public string? SortKey      { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
