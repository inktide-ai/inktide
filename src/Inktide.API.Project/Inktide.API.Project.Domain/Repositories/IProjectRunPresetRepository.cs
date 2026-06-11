using Inktide.API.Project.Domain.Entities;
namespace Inktide.API.Project.Domain.Repositories;

public interface IProjectRunPresetRepository
{
    Task<IReadOnlyList<ProjectRunPreset>> GetByProjectAsync(Guid projectId, CancellationToken ct);
    Task<ProjectRunPreset?> GetByIdAsync(Guid projectId, Guid presetId, CancellationToken ct);
    Task<ProjectRunPreset?> GetActiveAsync(Guid projectId, CancellationToken ct);
    Task AddAsync(ProjectRunPreset preset, CancellationToken ct);
    Task<bool> DeleteAsync(Guid projectId, Guid presetId, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}
