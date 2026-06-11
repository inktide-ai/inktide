using Inktide.API.Core.Generators;

namespace Inktide.API.Project.Domain.Entities;

public sealed class ProjectTool
{
    public Guid    Id         { get; set; }
    public Guid    ProjectId  { get; set; }
    public string  ToolName   { get; set; } = string.Empty;
    public string? ToolConfig { get; set; }
    public bool    IsEnabled  { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public static ProjectTool Create(Guid projectId, string toolName, string? toolConfig, bool isEnabled) => new()
    {
        Id         = IdGenerator.New(),
        ProjectId  = projectId,
        ToolName   = toolName,
        ToolConfig = toolConfig,
        IsEnabled  = isEnabled,
        CreatedAt  = DateTimeOffset.UtcNow,
    };
}
