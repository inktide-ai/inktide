using Chimera.API.TTS.Application.Configuration;
using Chimera.API.TTS.Domain.Speech;
using Microsoft.Extensions.Options;

namespace Chimera.API.TTS.Application;

/// <summary>
/// Resolves <see cref="ISpeechProvider"/> using optional request id + configured default.
/// </summary>
public static class SpeechProviderResolutionExtensions
{

    public static ISpeechProvider Resolve(
        this ISpeechProviderRegistry registry,
        IOptions<TtsProviderOptions> options,
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

    public static ISpeechProvider Resolve(
        this ISpeechProviderRegistry registry,
        TtsProviderOptions options,
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
