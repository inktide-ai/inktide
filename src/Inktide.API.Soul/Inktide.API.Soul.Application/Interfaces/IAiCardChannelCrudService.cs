using Inktide.API.Soul.Application.Models;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardChannelCrudService
{
    Task<ChannelLink> CreateAsync(Guid userId, Guid cardId, CreateChannelLinkCommand command, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid cardId, Guid linkId, CancellationToken ct = default);
    Task<ChannelLink> PatchAsync(Guid userId, Guid cardId, Guid linkId, PatchChannelLinkCommand command, CancellationToken ct = default);
}
