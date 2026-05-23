namespace Inktide.API.Core.Contracts;

public sealed record CardSummary(Guid Id, string Name, string? AvatarUrl);

/// <summary>
/// Cross-context port: Project.REST reads Soul card summaries for response enrichment
/// without a compile-time dependency on Soul.Infrastructure.
/// Implemented by Soul.Infrastructure.
/// </summary>
public interface ICardSummaryProvider
{
    Task<IReadOnlyDictionary<Guid, CardSummary>> GetSummariesAsync(
        IEnumerable<Guid> ids, CancellationToken ct = default);
}
