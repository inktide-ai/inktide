using Inktide.API.Core.Configuration;
using Microsoft.Extensions.Options;

namespace Inktide.API.Core;

public static class ChatProviderResolutionExtensions
{

    public static IChatProvider Resolve(
        this IChatProviderRegistry registry,
        IOptions<ChatProviderOptions> options,
        string? requestedProviderId)
    {
        ArgumentNullException.ThrowIfNull(registry);
        ArgumentNullException.ThrowIfNull(options);

        if (!string.IsNullOrWhiteSpace(requestedProviderId) &&
            registry.TryGet(requestedProviderId, out var requested) &&
            requested is not null)
        {
            return requested;
        }

        return registry.GetRequired(options.Value.DefaultProviderId);
    }

    public static IChatProvider Resolve(
        this IChatProviderRegistry registry,
        ChatProviderOptions options,
        string? requestedProviderId)
    {
        ArgumentNullException.ThrowIfNull(registry);
        ArgumentNullException.ThrowIfNull(options);

        if (!string.IsNullOrWhiteSpace(requestedProviderId) &&
            registry.TryGet(requestedProviderId, out var requested) &&
            requested is not null)
        {
            return requested;
        }

        return registry.GetRequired(options.DefaultProviderId);
    }

}
