using Inktide.API.Soul.Application.Models;

namespace Inktide.API.Soul.Application.Interfaces;

public interface IAiCardChannelConnectService
{
    Task<Guid> UpsertAsync(OAuthChannelUpsertCommand command, CancellationToken ct = default);
}
