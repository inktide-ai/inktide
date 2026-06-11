namespace Inktide.API.Core;

public interface IChannelOwnershipService
{
    Task<bool> OwnsChannelAsync(string userId, string channelId, CancellationToken ct = default);
}
