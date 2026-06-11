namespace Inktide.API.Core.Pagination;

/// <summary>Standard cursor-based paged response envelope.</summary>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    string? NextCursor,
    bool HasMore);
