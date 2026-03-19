using Chimera.API.Soul.Domain.Entities;

namespace Chimera.API.Soul.Application.Interfaces;

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

public sealed record AiCardAvatarUpdateResult(bool Success, AiCard? Card, string? Error);
