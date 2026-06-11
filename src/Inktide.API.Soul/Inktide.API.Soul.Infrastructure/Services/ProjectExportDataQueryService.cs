using Inktide.API.Core.Contracts;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Domain.ValueObjects;

namespace Inktide.API.Soul.Infrastructure.Services;

/// <summary>
/// Implements IProjectExportDataQuery (Core contract) so Project.Infrastructure can read
/// Soul data for export without a compile-time dependency on Soul.Infrastructure.
/// Behavior fields (personality, system prompt, response behavior, memory, auto pilot) have
/// moved to the Project context and are no longer stored on AiCard.
/// </summary>
internal sealed class ProjectExportDataQueryService : IProjectExportDataQuery
{
    private readonly IAiCardRepository _cardRepo;

    public ProjectExportDataQueryService(IAiCardRepository cardRepo)
    {
        _cardRepo = cardRepo ?? throw new ArgumentNullException(nameof(cardRepo));
    }

    public async Task<SoulExportSnapshot?> GetExportSnapshotAsync(
        Guid userId,
        Guid soulId,
        CancellationToken ct = default)
    {
        var card = await _cardRepo.GetByIdWithRelationsAsync(soulId, ct).ConfigureAwait(false);
        if (card is null || card.UserId != userId) return null;

        // Strip api_key from TTS config before export.
        string? ttsConfigJson = null;
        if (!string.IsNullOrWhiteSpace(card.TtsConfig))
        {
            var tts = TtsConfigSettings.Parse(card.TtsConfig);
            tts.ApiKey = null;
            ttsConfigJson = System.Text.Json.JsonSerializer.Serialize(tts, TtsJsonOpts);
        }

        return new SoulExportSnapshot(
            Name:                 card.Name,
            Slug:                 card.Slug,
            Description:          card.Description,
            Status:               card.Status.ToString().ToLower(),
            Personality:          string.Empty,
            SystemPrompt:         string.Empty,
            LlmModelId:           card.LlmCatalog?.ModelId ?? string.Empty,
            LlmProvider:          card.LlmCatalog?.Provider ?? string.Empty,
            LlmConfigJson:        card.LlmConfig,
            TtsVoiceId:           card.TtsCatalog?.VoiceId,
            TtsProvider:          card.TtsCatalog?.Provider,
            TtsConfigJson:        ttsConfigJson,
            AppearanceJson:       card.Appearance,
            ResponseBehaviorJson: "{}",
            MemorySettingsJson:   "{}",
            AutoPilotJson:        "{}",
            PersonalityConfigJson: "{}",
            Connectors:           []);
    }

    private static readonly System.Text.Json.JsonSerializerOptions TtsJsonOpts = new()
    {
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };
}
