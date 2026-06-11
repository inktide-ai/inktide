using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Persistence.Repositories;

internal sealed class ProjectRunPresetRepository(ProjectDbContext db) : IProjectRunPresetRepository
{
    public async Task<IReadOnlyList<ProjectRunPreset>> GetByProjectAsync(Guid projectId, CancellationToken ct)
        => await db.ProjectRunPresets
            .Where(p => p.ProjectId == projectId)
            .OrderBy(p => p.SortKey)
            .ToListAsync(ct);

    public Task<ProjectRunPreset?> GetByIdAsync(Guid projectId, Guid presetId, CancellationToken ct)
        => db.ProjectRunPresets.FirstOrDefaultAsync(p => p.ProjectId == projectId && p.Id == presetId, ct);

    public Task<ProjectRunPreset?> GetActiveAsync(Guid projectId, CancellationToken ct)
        => db.ProjectRunPresets.FirstOrDefaultAsync(p => p.ProjectId == projectId && p.IsActive, ct);

    public async Task AddAsync(ProjectRunPreset preset, CancellationToken ct)
    {
        db.ProjectRunPresets.Add(preset);
        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid presetId, CancellationToken ct)
    {
        var deleted = await db.ProjectRunPresets
            .Where(p => p.ProjectId == projectId && p.Id == presetId)
            .ExecuteDeleteAsync(ct);
        return deleted > 0;
    }

    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
