using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Persistence.Repositories;

internal sealed class ProjectToolRepository(ProjectDbContext db) : IProjectToolRepository
{
    public async Task<IReadOnlyList<ProjectTool>> GetByProjectAsync(Guid projectId, CancellationToken ct)
        => await db.Tools.Where(t => t.ProjectId == projectId).ToListAsync(ct);

    public Task<ProjectTool?> GetByIdAsync(Guid id, CancellationToken ct)
        => db.Tools.FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<ProjectTool> AddAsync(ProjectTool tool, CancellationToken ct)
    {
        db.Tools.Add(tool);
        await db.SaveChangesAsync(ct);
        return tool;
    }

    public async Task<ProjectTool> UpdateAsync(ProjectTool tool, CancellationToken ct)
    {
        db.Tools.Update(tool);
        await db.SaveChangesAsync(ct);
        return tool;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
        => await db.Tools.Where(t => t.Id == id).ExecuteDeleteAsync(ct);
}
