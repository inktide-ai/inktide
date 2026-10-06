using System.Text.Json;
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

        return new ProjectLinkResult(project.Id, project.SystemPrompt, pluginDtos, ReadLanguage(project.ResponseBehavior));
    }

    // response_behavior is the JSON the project's Skills page saves; "language" is the reply language code.
    private static string? ReadLanguage(string? responseBehavior)
    {
        if (string.IsNullOrWhiteSpace(responseBehavior)) return null;
        try
        {
            using var doc = JsonDocument.Parse(responseBehavior);
            return doc.RootElement.ValueKind == JsonValueKind.Object
                && doc.RootElement.TryGetProperty("language", out var language)
                && language.ValueKind == JsonValueKind.String
                    ? language.GetString()
                    : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
