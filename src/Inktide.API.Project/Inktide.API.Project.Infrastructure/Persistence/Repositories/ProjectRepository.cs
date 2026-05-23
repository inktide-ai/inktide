using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Inktide.API.Project.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Persistence.Repositories;

internal sealed class ProjectRepository : IProjectRepository
{
    private readonly ProjectDbContext _db;

    public ProjectRepository(ProjectDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ProjectEntity?> FindByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<ProjectEntity?> FindByIdAndUserAsync(Guid id, Guid userId, CancellationToken ct = default)
        => await _db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId, ct);

    public async Task<IReadOnlyList<ProjectEntity>> FindByUserAsync(Guid userId, CancellationToken ct = default)
        => await _db.Projects
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.SortKey)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ProjectEntity>> FindBySoulAsync(Guid userId, Guid soulId, CancellationToken ct = default)
        => await _db.Projects
            .Where(p => p.UserId == userId && p.ActiveSoulId == soulId)
            .OrderBy(p => p.SortKey)
            .ToListAsync(ct);

    public async Task<ProjectEntity> CreateAsync(ProjectEntity project, CancellationToken ct = default)
    {
        _db.Projects.Add(project);
        await _db.SaveChangesAsync(ct);
        return project;
    }

    public async Task<ProjectEntity> UpdateAsync(ProjectEntity project, CancellationToken ct = default)
    {
        _db.Projects.Update(project);
        await _db.SaveChangesAsync(ct);
        return project;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (project is not null)
        {
            _db.Projects.Remove(project);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<IReadOnlyList<(Guid Id, string SortKey)>> GetSortKeysAsync(Guid userId, CancellationToken ct = default)
    {
        var rows = await _db.Projects
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.SortKey)
            .Select(p => new { p.Id, p.SortKey })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return rows.Select(r => (r.Id, r.SortKey)).ToList();
    }

    public async Task BulkUpdateSortKeysAsync(IReadOnlyList<(Guid Id, string SortKey)> updates, DateTime updatedAt, CancellationToken ct = default)
    {
        foreach (var (id, sortKey) in updates)
        {
            await _db.Projects
                .Where(p => p.Id == id)
                .ExecuteUpdateAsync(
                    s => s
                        .SetProperty(e => e.SortKey, sortKey)
                        .SetProperty(e => e.UpdatedAt, updatedAt),
                    ct)
                .ConfigureAwait(false);
        }
    }
}
