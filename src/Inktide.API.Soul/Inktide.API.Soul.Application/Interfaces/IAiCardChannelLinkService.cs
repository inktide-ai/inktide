using Inktide.API.Soul.Application.Models;

namespace Inktide.API.Soul.Application.Interfaces;

/// <summary>User-owned links between an AI card and external chat platforms (Discord, Twitch, …).</summary>
public interface IAiCardChannelLinkService
{
    Task<ChannelLink> CreateAsync(
        Guid userId,
        Guid cardId,
        CreateChannelLinkCommand command,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid userId, Guid cardId, Guid linkId, CancellationToken cancellationToken = default);

    Task<ChannelLink> PatchAsync(
        Guid userId,
        Guid cardId,
        Guid linkId,
        PatchChannelLinkCommand command,
        CancellationToken cancellationToken = default);
}
