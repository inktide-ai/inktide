namespace Inktide.API.Project.Infrastructure.Persistence.ReadModels;

internal sealed class CardSummaryReadModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}
