using System.Text.Json;
using Inktide.API.Core.Contracts;
using Inktide.API.Project.Domain.ValueObjects;
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
        var row = await _db.Projects
            .Where(p => p.ActiveSoulId == soulId)
            .Select(p => new { p.Id, p.SystemPrompt, p.PluginsJson })
            .FirstOrDefaultAsync(ct);

        if (row is null) return null;

        var plugins = JsonSerializer.Deserialize<List<ProjectPlugin>>(row.PluginsJson) ?? [];
        var pluginDtos = plugins
            .Select(p => new ProjectPluginDto(p.PluginId, p.IsEnabled, p.Config))
            .ToList();

        return new ProjectLinkResult(row.Id, row.SystemPrompt, pluginDtos);
    }
}
