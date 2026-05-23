using Inktide.API.Soul.Domain.Entities;

namespace Inktide.API.Soul.Domain.Repositories;

public interface IAiCardChannelRepository
{
    Task<IReadOnlyList<AiCardChannel>> GetByCardIdAsync(Guid aiCardId, CancellationToken ct = default);
    Task<AiCardChannel?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Tracked entity for updates (not no-tracking).</summary>
    Task<AiCardChannel?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default);
    Task<AiCardChannel> CreateAsync(AiCardChannel channel, CancellationToken ct = default);
    Task UpdateAsync(AiCardChannel channel, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<AiCardChannel>> GetActiveByPlatformAsync(string platform, CancellationToken ct = default);

    /// <summary>Returns all active Discord channels with a non-null guild_id for registry population.</summary>
    Task<IReadOnlyList<AiCardChannel>> GetActiveDiscordChannelsAsync(CancellationToken ct = default);
}
