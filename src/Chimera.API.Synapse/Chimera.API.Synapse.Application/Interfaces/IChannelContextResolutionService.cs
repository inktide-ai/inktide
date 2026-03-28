using Chimera.API.Synapse.Application.Models;

namespace Chimera.API.Synapse.Application.Interfaces;

/// <summary>
/// Resolves <see cref="AiCardContext"/> for the inbound channel (must run before scatter shards that depend on it).
/// </summary>
public interface IChannelContextResolutionService
{
    Task ResolveAsync(MessageProcessingContext context, CancellationToken cancellationToken = default);
}
