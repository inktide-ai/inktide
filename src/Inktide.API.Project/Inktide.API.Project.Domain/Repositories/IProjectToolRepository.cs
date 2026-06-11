using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Domain.Repositories;

public interface IProjectToolRepository
{
    Task<IReadOnlyList<ProjectTool>> GetByProjectAsync(Guid projectId, CancellationToken ct);
    Task<ProjectTool?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<ProjectTool> AddAsync(ProjectTool tool, CancellationToken ct);
    Task<ProjectTool> UpdateAsync(ProjectTool tool, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}
