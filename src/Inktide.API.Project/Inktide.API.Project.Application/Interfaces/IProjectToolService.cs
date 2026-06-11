using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Application.Interfaces;

public interface IProjectToolService
{
    Task<IReadOnlyList<ProjectTool>> ListAsync(Guid projectId, CancellationToken ct = default);
    Task<ProjectTool?> GetByIdAsync(Guid toolId, CancellationToken ct = default);
    Task<ProjectTool> CreateAsync(Guid projectId, string toolName, string? toolConfig, bool isEnabled, CancellationToken ct = default);
    Task<ProjectTool> UpdateAsync(Guid toolId, string toolName, string? toolConfig, bool isEnabled, CancellationToken ct = default);
    Task DeleteAsync(Guid toolId, CancellationToken ct = default);
}
