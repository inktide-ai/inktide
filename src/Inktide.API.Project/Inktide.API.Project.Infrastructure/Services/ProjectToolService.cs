using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;

namespace Inktide.API.Project.Infrastructure.Services;

public sealed class ProjectToolService : IProjectToolService
{
    private readonly IProjectToolRepository _repo;

    public ProjectToolService(IProjectToolRepository repo)
    {
        _repo = repo ?? throw new ArgumentNullException(nameof(repo));
    }

    public Task<IReadOnlyList<ProjectTool>> ListAsync(Guid projectId, CancellationToken ct = default)
        => _repo.GetByProjectAsync(projectId, ct);

    public Task<ProjectTool?> GetByIdAsync(Guid toolId, CancellationToken ct = default)
        => _repo.GetByIdAsync(toolId, ct);

    public async Task<ProjectTool> CreateAsync(Guid projectId, string toolName, string? toolConfig, bool isEnabled, CancellationToken ct = default)
    {
        var tool = ProjectTool.Create(projectId, toolName, toolConfig, isEnabled);
        return await _repo.AddAsync(tool, ct);
    }

    public async Task<ProjectTool> UpdateAsync(Guid toolId, string toolName, string? toolConfig, bool isEnabled, CancellationToken ct = default)
    {
        var tool = await _repo.GetByIdAsync(toolId, ct)
            ?? throw new InvalidOperationException($"Tool {toolId} not found.");
        tool.ToolName   = toolName;
        tool.ToolConfig = toolConfig;
        tool.IsEnabled  = isEnabled;
        return await _repo.UpdateAsync(tool, ct);
    }

    public Task DeleteAsync(Guid toolId, CancellationToken ct = default)
        => _repo.DeleteAsync(toolId, ct);
}
