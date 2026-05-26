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

public enum AiCardBannerError { None, CardNotFound, StorageUnavailable }

public sealed record AiCardBannerUpdateResult(
    bool Success,
    AiCardBannerError ErrorKind,
    AiCard? Card,
    string? Error)
{
    public static AiCardBannerUpdateResult Ok(AiCard card) =>
        new(true, AiCardBannerError.None, card, null);

    public static AiCardBannerUpdateResult Fail(AiCardBannerError kind, string msg) =>
        new(false, kind, null, msg);
}
