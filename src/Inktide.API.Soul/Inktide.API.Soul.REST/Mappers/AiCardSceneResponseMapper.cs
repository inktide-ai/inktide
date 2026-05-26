using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Mappers;

public static class AiCardSceneResponseMapper
{
    public static AiCardSceneResponse ToResponse(AiCardScene dto) => new()
    {
        Id               = dto.Id,
        AiCardId         = dto.AiCardId,
        StorageKey       = dto.StorageKey,
        PublicUrl        = dto.PublicUrl,
        OriginalFileName = dto.OriginalFileName,
        ContentType      = dto.ContentType,
        SizeBytes        = dto.SizeBytes,
        CreatedAt        = dto.CreatedAt,
        Tag              = dto.Tag,
        DisplayName      = dto.DisplayName,
        Description      = dto.Description,
        SortKey          = dto.SortKey,
    };
}
