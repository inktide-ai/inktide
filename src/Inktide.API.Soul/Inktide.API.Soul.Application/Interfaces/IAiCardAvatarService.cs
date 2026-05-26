using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardAvatarService
{
    Task<AiCardAvatarUpdateResult> UploadAvatarAsync(
        Guid userId,
        Guid cardId,
        Stream fileStream,
        string fileName,
        string? contentType,
        CancellationToken ct = default);
}

public enum AiCardAvatarError { None, CardNotFound, StorageUnavailable }

public sealed record AiCardAvatarUpdateResult(
    bool Success,
    AiCardAvatarError ErrorKind,
    AiCard? Card,
    string? Error)
{
    public static AiCardAvatarUpdateResult Ok(AiCard card) =>
        new(true, AiCardAvatarError.None, card, null);

    public static AiCardAvatarUpdateResult Fail(AiCardAvatarError kind, string msg) =>
        new(false, kind, null, msg);
}
