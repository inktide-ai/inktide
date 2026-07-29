using Inktide.API.Core.Contracts;
using Inktide.API.Core.Pagination;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Enums;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardService
{
    Task<AiCard> CreateAsync(
        Guid userId,
        AiCard card,
        string? llmConfigProviderId = null,
        CancellationToken ct = default);
    
    Task<AiCard?> GetByIdAsync(
        Guid userId,
        Guid cardId,
        CancellationToken ct = default);
    
    Task<IReadOnlyList<AiCard>> GetAllByUserAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<PagedResult<AiCard>> GetPagedByUserAsync(
        Guid userId,
        int limit,
        string? cursor,
        CancellationToken ct = default);
    
    Task<AiCard> UpdateAsync(
        Guid userId, 
        AiCard card,
        CancellationToken ct = default);
    
    Task DeleteAsync(
        Guid userId,
        Guid cardId,
        CancellationToken ct = default);

    /// <summary>Move a card to a new position. previousId=null -> beginning; nextId=null -> end. Returns null when not found.</summary>
    Task<AiCard?> ReorderAsync(Guid userId, Guid cardId, Guid? previousId, Guid? nextId, CancellationToken ct = default);

    /// <summary>
    /// Creates a Soul from a cross-context import command. Returns the new Soul ID.
    /// AiCard entity is built entirely inside Soul - callers never construct domain entities.
    /// </summary>
    Task<Guid> CreateFromImportAsync(Guid userId, ImportSoulCommand command, CancellationToken ct = default);

    /// <summary>
    /// Changes the run status of a soul card. <paramref name="action"/> must be "start", "pause", or "stop" (case-insensitive).
    /// Returns null when not found or not owned by userId. Throws <see cref="ArgumentException"/> for unknown actions.
    /// </summary>
    Task<AiCard?> ChangeStatusAsync(Guid userId, Guid cardId, string action, CancellationToken ct = default);

    /// <summary>Returns public-facing soul data by slug; no auth required. Returns null when not found.</summary>
    Task<AiCard?> GetPublicBySlugAsync(string slug, CancellationToken ct = default);
}
