using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IProjectImportService
{
    Task<AiCard> ImportAsync(Guid userId, AiCard card, CancellationToken ct = default);
}
