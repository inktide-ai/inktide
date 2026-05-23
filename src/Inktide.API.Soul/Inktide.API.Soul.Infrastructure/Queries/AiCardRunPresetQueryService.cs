using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.Domain.Repositories;

namespace Inktide.API.Soul.Infrastructure.Queries;

public sealed class AiCardRunPresetQueryService : IAiCardRunPresetQueryService
{

    private readonly IAiCardRunPresetRepository _repo;


    public AiCardRunPresetQueryService(IAiCardRunPresetRepository repo)
    {
        _repo = repo ?? throw new ArgumentNullException(nameof(repo));
    }


    public async Task<ActiveRunPresetDto?> GetActiveForCardAsync(Guid cardId, CancellationToken ct = default)
    {
        var preset = await _repo.GetActiveAsync(cardId, ct).ConfigureAwait(false);
        if (preset is null) return null;

        return new ActiveRunPresetDto(
            Id:                     preset.Id,
            Name:                   preset.Name,
            OverrideLlmModelId:     preset.OverrideLlmModelId,
            OverrideTemperature:    preset.OverrideTemperature,
            OverrideEmotionPresetId: preset.OverrideEmotionPresetId,
            OverrideVoiceProfileId:  preset.OverrideVoiceProfileId);
    }

}
