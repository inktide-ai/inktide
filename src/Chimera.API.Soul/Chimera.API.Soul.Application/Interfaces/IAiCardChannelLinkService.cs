using Chimera.API.Soul.Application.Models;

namespace Chimera.API.Soul.Application.Interfaces;

/// <summary>User-owned links between an AI card and external chat platforms (Discord, Twitch, …).</summary>
public interface IAiCardChannelLinkService
{
    Task<ChannelLinkDto> CreateAsync(
        Guid userId,
        Guid cardId,
        CreateChannelLinkCommand command,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid userId, Guid cardId, Guid linkId, CancellationToken cancellationToken = default);

    Task<ChannelLinkDto> PatchAsync(
        Guid userId,
        Guid cardId,
        Guid linkId,
        PatchChannelLinkCommand command,
        CancellationToken cancellationToken = default);
}
