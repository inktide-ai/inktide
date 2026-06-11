using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Persistence.Repositories;

internal sealed class ProjectSceneRepository(ProjectDbContext db) : IProjectSceneRepository
{
    public async Task<IReadOnlyList<ProjectScene>> GetByProjectAsync(Guid projectId, CancellationToken ct)
        => await db.Scenes.Where(s => s.ProjectId == projectId).OrderBy(s => s.SortKey).ToListAsync(ct);

    public Task<ProjectScene?> GetByIdAsync(Guid id, CancellationToken ct)
        => db.Scenes.FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<ProjectScene> CreateAsync(ProjectScene scene, CancellationToken ct)
    {
        db.Scenes.Add(scene);
        await db.SaveChangesAsync(ct);
        return scene;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
        => await db.Scenes.Where(s => s.Id == id).ExecuteDeleteAsync(ct);

    public async Task<IReadOnlyList<(Guid Id, string? SortKey)>> GetSortKeysAsync(Guid projectId, CancellationToken ct)
    {
        var rows = await db.Scenes
            .AsNoTracking()
            .Where(s => s.ProjectId == projectId)
            .OrderBy(s => s.SortKey)
            .Select(s => new { s.Id, s.SortKey })
            .ToListAsync(ct);
        return rows.Select(r => (r.Id, r.SortKey)).ToList();
    }

    public async Task UpdateSortKeyAsync(Guid sceneId, string sortKey, CancellationToken ct)
        => await db.Scenes
            .Where(s => s.Id == sceneId)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.SortKey, sortKey), ct);
}
