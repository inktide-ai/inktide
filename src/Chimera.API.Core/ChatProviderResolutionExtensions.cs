using Chimera.API.Core.Configuration;
using Microsoft.Extensions.Options;

namespace Chimera.API.Core;

/// <summary>
/// Resolves which <see cref="IChatProvider"/> to use using optional request id + configured default.
/// </summary>
public static class ChatProviderResolutionExtensions
{
    #region Public Methods

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

    #endregion
}
