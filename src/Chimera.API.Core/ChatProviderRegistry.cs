using System.Collections.ObjectModel;
using System.Diagnostics.CodeAnalysis;
using Chimera.API.Domain.Models;

namespace Chimera.API.Core;

/// <summary>
/// Single startup pass: validates unique <see cref="IProvider.Id"/>, exposes descriptors for UI/policy.
/// </summary>
public sealed class ChatProviderRegistry : IChatProviderRegistry
{
    #region Fields

    private readonly IReadOnlyDictionary<string, IChatProvider> _byId;
    private readonly IReadOnlyDictionary<string, ChatProviderDescriptor> _descriptors;
    private readonly IReadOnlyList<IChatProvider> _all;

    #endregion

    #region Constructors

    public ChatProviderRegistry(IEnumerable<IChatProvider> providers)
    {
        ArgumentNullException.ThrowIfNull(providers);

        var list = providers.ToList();
        var seen = new HashSet<string>(StringComparer.Ordinal);

        foreach (var provider in list)
        {
            if (!seen.Add(provider.Id))
            {
                throw new InvalidOperationException(
                    $"Duplicate chat provider id: '{provider.Id}'. Each registered {nameof(IChatProvider)} must have a unique id.");
            }
        }

        _byId = new ReadOnlyDictionary<string, IChatProvider>(
            list.ToDictionary(p => p.Id, StringComparer.Ordinal));

        _descriptors = new ReadOnlyDictionary<string, ChatProviderDescriptor>(
            list.ToDictionary(
                p => p.Id,
                BuildDescriptor,
                StringComparer.Ordinal));

        _all = new ReadOnlyCollection<IChatProvider>(list);
    }

    #endregion

    #region Properties

    public IReadOnlyDictionary<string, ChatProviderDescriptor> Descriptors => _descriptors;

    public IReadOnlyList<IChatProvider> All => _all;

    #endregion

    #region Public Methods

    public IChatProvider GetRequired(string providerId)
    {
        if (!_byId.TryGetValue(providerId, out var provider))
        {
            throw new KeyNotFoundException($"Chat provider '{providerId}' is not registered.");
        }

        return provider;
    }

    public bool TryGet(string providerId, [NotNullWhen(true)] out IChatProvider? provider)
        => _byId.TryGetValue(providerId, out provider);

    #endregion

    #region Private Methods

    private static ChatProviderDescriptor BuildDescriptor(IChatProvider provider)
    {
        var caps = provider.Capabilities;
        return new ChatProviderDescriptor
        {
            Id = provider.Id,
            DisplayName = provider.Name,
            Capabilities = new ChatProviderCapabilities
            {
                SupportsStreaming = caps.SupportsStreaming,
                SupportsTools = caps.SupportsTools,
                MaxContextTokens = caps.MaxContextTokens,
            },
        };
    }

    #endregion
}
