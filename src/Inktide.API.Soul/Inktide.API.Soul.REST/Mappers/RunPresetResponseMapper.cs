using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Mappers;

public static class RunPresetResponseMapper
{
    public static RunPresetResponse ToResponse(AiCardRunPreset p) => new()
    {
        Id                      = p.Id,
        AiCardId                = p.AiCardId,
        Name                    = p.Name,
        Description             = p.Description,
        Icon                    = p.Icon,
        IsActive                = p.IsActive,
        SortKey                 = p.SortKey,
        OverrideLlmModelId      = p.OverrideLlmModelId,
        OverrideTemperature     = p.OverrideTemperature,
        OverrideEmotionPresetId = p.OverrideEmotionPresetId,
        OverrideVoiceProfileId  = p.OverrideVoiceProfileId,
        CreatedAt               = p.CreatedAt,
        UpdatedAt               = p.UpdatedAt,
    };
}
