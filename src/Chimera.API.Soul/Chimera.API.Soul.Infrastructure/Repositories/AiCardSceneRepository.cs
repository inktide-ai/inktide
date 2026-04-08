using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Soul.Infrastructure.Repositories;

public sealed class AiCardSceneRepository : IAiCardSceneRepository
{
    #region Fields

    private readonly SoulDbContext _db;

    #endregion

    #region Constructors

    public AiCardSceneRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    #endregion

    #region Public Methods

    public async Task<AiCardScene> AddAsync(AiCardScene scene, CancellationToken ct = default)
    {
        _db.AiCardScenes.Add(scene);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return scene;
    }

    public async Task<IReadOnlyList<AiCardScene>> ListByCardAsync(Guid userId, Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardScenes
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.AiCardId == aiCardId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<AiCardScene?> GetByIdAsync(Guid userId, Guid aiCardId, Guid sceneId, CancellationToken ct = default)
    {
        return await _db.AiCardScenes
            .AsNoTracking()
            .FirstOrDefaultAsync(
                s => s.Id == sceneId && s.UserId == userId && s.AiCardId == aiCardId,
                ct)
            .ConfigureAwait(false);
    }

    public async Task DeleteAsync(AiCardScene scene, CancellationToken ct = default)
    {
        await _db.AiCardScenes
            .Where(s => s.Id == scene.Id)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AiCardScene>> ListOthersByCardAsync(Guid userId, Guid aiCardId, Guid excludeId, CancellationToken ct = default)
    {
        return await _db.AiCardScenes
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.AiCardId == aiCardId && s.Id != excludeId)
            .ToListAsync(ct)
            .ConfigureAwait(false);
    }

    #endregion
}
