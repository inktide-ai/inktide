using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardChannelLifecycleService
{
    Task<AiCardChannel?> GetByIdAsync(Guid userId, Guid channelId, CancellationToken ct = default);
    Task DeactivateAsync(Guid userId, Guid channelId, CancellationToken ct = default);
    Task SetCustomBotTokenAsync(Guid userId, Guid channelId, string? encryptedToken, CancellationToken ct = default);
}
