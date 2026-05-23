using Inktide.API.Core.Contracts;
using Inktide.API.Project.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Services;

internal sealed class ProjectBySoulQueryService : IProjectBySoulQuery
{
    private readonly ProjectDbContext _db;

    public ProjectBySoulQueryService(ProjectDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ProjectLinkResult?> FindProjectIdBySoulIdAsync(Guid soulId, CancellationToken ct = default)
    {
        var project = await _db.Projects
            .Where(p => p.ActiveSoulId == soulId)
            .FirstOrDefaultAsync(ct);

        if (project is null) return null;

        var pluginDtos = project.Plugins
            .Select(p => new ProjectPluginDto(p.PluginId, p.IsEnabled, p.Config))
            .ToList();

        return new ProjectLinkResult(project.Id, project.SystemPrompt, pluginDtos);
    }
}
