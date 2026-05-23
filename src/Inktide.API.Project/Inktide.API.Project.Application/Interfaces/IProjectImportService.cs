namespace Inktide.API.Project.Application.Interfaces;

public sealed record ImportProjectCommand(
    string ProjectName,
    InktSoulCommand? Soul,
    string? GraphPayloadJson);

public sealed record InktSoulCommand(
    string Name,
    string? Personality,
    string SystemPrompt,
    string? AvatarUrl,
    string? Description,
    string Status,
    string? CoverUrl,
    Guid LlmCatalogId,
    string LlmConfig,
    Guid? TtsCatalogId,
    string? TtsConfig,
    string Appearance,
    string ResponseBehavior,
    string MemorySettings,
    string AutoPilot);

public sealed record ImportProjectResult(Guid ProjectId, Guid? SoulId);

public interface IProjectImportService
{
    Task<ImportProjectResult> ImportAsync(Guid userId, ImportProjectCommand command, CancellationToken ct = default);
}
