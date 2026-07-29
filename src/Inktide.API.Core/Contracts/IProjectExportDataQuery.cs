namespace Inktide.API.Core.Contracts;

/// <summary>
/// Carries a secret-free snapshot of a Soul (AiCard) for export into a .inkt archive.
/// Catalog references are portable string identifiers (modelId, voiceId), not Guids.
/// </summary>
public sealed record SoulExportSnapshot(
    string Name,
    string Slug,
    string Description,
    string Status,
    string Personality,
    string SystemPrompt,
    string LlmModelId,
    string LlmProvider,
    string LlmConfigJson,
    string? TtsVoiceId,
    string? TtsProvider,
    string? TtsConfigJson,
    string AppearanceJson,
    string ResponseBehaviorJson,
    string MemorySettingsJson,
    string AutoPilotJson,
    string PersonalityConfigJson,
    IReadOnlyList<ConnectorExportRecord> Connectors);

/// <summary>Channel metadata included in export - no tokens, no secrets.</summary>
public sealed record ConnectorExportRecord(
    string LocalId,
    string Platform,
    string ChannelName,
    string BotUsername);

/// <summary>
/// Cross-context port: Project.Infrastructure reads Soul data for export
/// without a compile-time dependency on Soul.Infrastructure.
/// Implemented by Soul.Infrastructure.
/// </summary>
public interface IProjectExportDataQuery
{
    /// <summary>Returns null when the Soul does not exist or does not belong to userId.</summary>
    Task<SoulExportSnapshot?> GetExportSnapshotAsync(
        Guid userId,
        Guid soulId,
        CancellationToken ct = default);
}
