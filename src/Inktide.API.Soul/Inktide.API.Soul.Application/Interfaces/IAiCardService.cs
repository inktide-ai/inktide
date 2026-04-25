using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardService
{
    Task<AiCard> CreateAsync(
        Guid userId,
        AiCard card,
        CancellationToken ct = default);
    
    Task<AiCard?> GetByIdAsync(
        Guid userId,
        Guid cardId,
        CancellationToken ct = default);
    
    Task<IReadOnlyList<AiCard>> GetAllByUserAsync(
        Guid userId, 
        CancellationToken ct = default);
    
    Task<AiCard> UpdateAsync(
        Guid userId, 
        AiCard card,
        CancellationToken ct = default);
    
    Task DeleteAsync(
        Guid userId, 
        Guid cardId,
        CancellationToken ct = default);
    
}
