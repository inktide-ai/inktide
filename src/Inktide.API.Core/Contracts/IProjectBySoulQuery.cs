namespace Inktide.API.Core.Contracts;

public sealed record ProjectPluginDto(
    string PluginId,
    bool IsEnabled,
    IReadOnlyDictionary<string, string> Config);

/// <summary>
/// Carries the minimal project data Synapse needs when resolving channel context.
/// </summary>
public sealed record ProjectLinkResult(
    Guid Id,
    string? SystemPrompt,
    IReadOnlyList<ProjectPluginDto> Plugins);

/// <summary>
/// Cross-context contract: allows Synapse to resolve which Project is linked to a given Soul,
/// without a compile-time dependency on Project.Infrastructure.
/// Implemented by Project.Infrastructure, consumed by Synapse during pipeline enrichment.
/// </summary>
public interface IProjectBySoulQuery
{
    Task<ProjectLinkResult?> FindProjectIdBySoulIdAsync(Guid soulId, CancellationToken ct = default);
}
