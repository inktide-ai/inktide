namespace Inktide.API.Project.Application.Interfaces;

public sealed record CardSummary(Guid Id, string Name, string? AvatarUrl);

public interface ICardSummaryProvider
{
    Task<IReadOnlyDictionary<Guid, CardSummary>> GetSummariesAsync(
        IEnumerable<Guid> ids, CancellationToken ct = default);
}
