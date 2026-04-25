using Inktide.API.Synapse.Application.Interfaces;
using Microsoft.SemanticKernel.ChatCompletion;

namespace Inktide.API.Synapse.Infrastructure.Providers;

/// <summary>
/// Resolves the correct <see cref="IChatServiceFactory"/> for a given provider ID.
///
/// Factories are ranked by <see cref="IChatServiceFactory.Priority"/> (descending) at construction
/// time so resolution is a simple linear scan — O(n) where n is the number of registered factories,
/// which is always tiny.
///
/// Lifetime: Singleton. The sorted list is built once at startup.
/// </summary>
public sealed class ChatServiceFactoryRegistry
{
    private readonly IReadOnlyList<IChatServiceFactory> _sorted;

    public ChatServiceFactoryRegistry(IEnumerable<IChatServiceFactory> factories)
    {
        _sorted = (factories ?? throw new ArgumentNullException(nameof(factories)))
            .OrderByDescending(f => f.Priority)
            .ToList();

        if (_sorted.Count == 0)
            throw new InvalidOperationException(
                "No IChatServiceFactory implementations are registered. " +
                "At minimum register OpenAiCompatChatServiceFactory.");
    }

    /// <summary>
    /// Returns the highest-priority factory that can handle <paramref name="providerId"/>,
    /// or throws if none is found.
    /// </summary>
    public IChatServiceFactory Resolve(string providerId)
    {
        foreach (var factory in _sorted)
        {
            if (factory.CanHandle(providerId))
                return factory;
        }

        throw new InvalidOperationException(
            $"No IChatServiceFactory registered for provider '{providerId}'. " +
            $"Registered factories: [{string.Join(", ", _sorted.Select(f => f.GetType().Name))}]");
    }

    /// <summary>
    /// Creates an <see cref="IChatCompletionService"/> directly — convenience wrapper
    /// around <see cref="Resolve"/> + <see cref="IChatServiceFactory.Create"/>.
    /// </summary>
    public IChatCompletionService CreateService(
        string providerId, string modelId, string apiKey, string? baseUrl)
        => Resolve(providerId).Create(modelId, apiKey, baseUrl);
}
