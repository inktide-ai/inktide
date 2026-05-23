namespace Inktide.API.Project.Application.Interfaces;

public sealed record InktFileParseResult(
    string ProjectName,
    string? SoulName,
    bool HasGraph,
    int ConnectorCount,
    string? LlmModelId,
    string? LlmProvider,
    string? TtsVoiceId,
    string? TtsProvider,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<string> Errors,
    /// <summary>Redis cache key for the intermediate context. Empty when Errors is non-empty.</summary>
    string ParseToken);

public sealed record InktFileFinalizeCommand(
    string ParseToken,
    /// <summary>Null = create a new Soul from the exported config.</summary>
    Guid? TargetSoulId,
    /// <summary>When true, connector stubs are not created (tokens are stripped; re-auth required).</summary>
    bool ImportConnectorsDisabled);

public sealed record InktFileFinalizeResult(Guid ProjectId, Guid? SoulId);

public interface IInktFileImportService
{
    /// <summary>
    /// Phase 1: validates and parses the .inkt ZIP, returns preview data and warnings.
    /// On success, ParseToken references the cached intermediate context (10 min TTL).
    /// On failure, Errors is populated and ParseToken is empty.
    /// </summary>
    Task<InktFileParseResult> ParseAsync(Guid userId, Stream inktFileStream, CancellationToken ct = default);

    /// <summary>
    /// Phase 2: finalizes the import using the cached context from ParseAsync.
    /// Creates a new Project (and optionally a new Soul) and imports the graph.
    /// </summary>
    Task<InktFileFinalizeResult> FinalizeAsync(Guid userId, InktFileFinalizeCommand command, CancellationToken ct = default);
}
