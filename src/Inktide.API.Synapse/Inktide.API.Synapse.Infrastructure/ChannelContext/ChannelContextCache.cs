using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Caching.Memory;

namespace Inktide.API.Synapse.Infrastructure.ChannelContext;

public sealed class ChannelContextCache(IMemoryCache cache)
{
    internal async Task<AiCardContext?> GetOrSetAsync(
        string channelId,
        Func<Task<AiCardContext?>> factory)
    {
        var key = SynapseConstants.Cache.ChannelContextKeyPrefix + channelId;

        if (cache.TryGetValue(key, out AiCardContext? existing))
            return existing;

        var resolved = await factory();
        if (resolved is not null)
            cache.Set(key, resolved, SynapseConstants.Cache.ChannelContextTtl);

        return resolved;
    }
}
