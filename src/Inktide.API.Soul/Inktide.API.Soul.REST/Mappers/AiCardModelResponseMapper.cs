using Inktide.API.Soul.Application.Interfaces;
using Inktide.API.Soul.REST.Models;

namespace Inktide.API.Soul.REST.Mappers;

public static class AiCardModelResponseMapper
{
    public static AiCardModelResponse ToResponse(AiCardModel dto) => new()
    {
        Id               = dto.Id,
        AiCardId         = dto.AiCardId,
        StorageKey       = dto.StorageKey,
        PublicUrl        = dto.PublicUrl,
        OriginalFileName = dto.OriginalFileName,
        ContentType      = dto.ContentType,
        SizeBytes        = dto.SizeBytes,
        CreatedAt        = dto.CreatedAt,
        IsActive         = dto.IsActive,
        ThumbnailUrl     = dto.ThumbnailUrl,
    };
}
