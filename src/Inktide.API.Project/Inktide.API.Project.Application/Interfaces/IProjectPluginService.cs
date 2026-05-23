using Inktide.API.Project.Domain.ValueObjects;

namespace Inktide.API.Project.Application.Interfaces;

public interface IProjectPluginService
{
    Task<IReadOnlyList<ProjectPlugin>> GetPluginsAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ProjectPlugin> UpsertPluginAsync(Guid id, Guid userId, string pluginId, bool isEnabled, Dictionary<string, string>? config, CancellationToken ct = default);
}
