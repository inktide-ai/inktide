using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardBannerService
{
    Task<AiCardBannerUpdateResult> UploadBannerAsync(
        Guid userId,
        Guid cardId,
        Stream fileStream,
        string fileName,
        string? contentType,
        CancellationToken ct = default);

    Task<AiCardBannerUpdateResult> RemoveBannerAsync(
        Guid userId,
        Guid cardId,
        CancellationToken ct = default);
}

public sealed record AiCardBannerUpdateResult(bool Success, AiCard? Card, string? Error);
