using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Infrastructure.DbContext;

namespace Inktide.API.Soul.Infrastructure.Services;

public sealed class ProjectImportService : IProjectImportService
{
    private readonly SoulDbContext _db;
    private readonly IAiCardService _cardService;

    public ProjectImportService(SoulDbContext db, IAiCardService cardService)
    {
        _db          = db          ?? throw new ArgumentNullException(nameof(db));
        _cardService = cardService ?? throw new ArgumentNullException(nameof(cardService));
    }

    public async Task<AiCard> ImportAsync(
        Guid userId,
        AiCard card,
        CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct).ConfigureAwait(false);
        var created = await _cardService.CreateAsync(userId, card, ct: ct).ConfigureAwait(false);
        await tx.CommitAsync(ct).ConfigureAwait(false);
        return created;
    }
}
