using System.Collections.ObjectModel;
using System.Diagnostics.CodeAnalysis;
using Chimera.API.Core;
using Chimera.API.TTS.Domain.Models;

namespace Chimera.API.TTS.Domain.Speech;

/// <summary>
/// Validates unique <see cref="IProvider.Id"/> and exposes <see cref="SpeechProviderDescriptor"/> for UI/catalog.
/// </summary>
public sealed class SpeechProviderRegistry : ISpeechProviderRegistry
{
    #region Fields

    private readonly IReadOnlyDictionary<string, ISpeechProvider> _byId;
    private readonly IReadOnlyDictionary<string, SpeechProviderDescriptor> _descriptors;
    private readonly IReadOnlyList<ISpeechProvider> _all;

    #endregion

    #region Constructors

    public SpeechProviderRegistry(IEnumerable<ISpeechProvider> providers)
    {
        ArgumentNullException.ThrowIfNull(providers);

        var list = providers.ToList();
        var seen = new HashSet<string>(StringComparer.Ordinal);

        foreach (var provider in list)
        {
            if (!seen.Add(provider.Id))
            {
                throw new InvalidOperationException(
                    $"Duplicate speech provider id: '{provider.Id}'. Each registered {nameof(ISpeechProvider)} must have a unique id.");
            }
        }

        _byId = new ReadOnlyDictionary<string, ISpeechProvider>(
            list.ToDictionary(p => p.Id, StringComparer.Ordinal));

        _descriptors = new ReadOnlyDictionary<string, SpeechProviderDescriptor>(
            list.ToDictionary(
                p => p.Id,
                BuildDescriptor,
                StringComparer.Ordinal));

        _all = new ReadOnlyCollection<ISpeechProvider>(list);
    }

    #endregion

    #region Properties

    public IReadOnlyDictionary<string, SpeechProviderDescriptor> Descriptors => _descriptors;

    public IReadOnlyList<ISpeechProvider> All => _all;

    #endregion

    #region Public Methods

    public ISpeechProvider GetRequired(string providerId)
    {
        if (!_byId.TryGetValue(providerId, out var provider))
        {
            throw new KeyNotFoundException($"Speech provider '{providerId}' is not registered.");
        }

        return provider;
    }

    public bool TryGet(string providerId, [NotNullWhen(true)] out ISpeechProvider? provider)
        => _byId.TryGetValue(providerId, out provider);

    #endregion

    #region Private Methods

    private static SpeechProviderDescriptor BuildDescriptor(ISpeechProvider provider)
    {
        var caps = provider.Capabilities;
        return new SpeechProviderDescriptor
        {
            Id = provider.Id,
            DisplayName = provider.Name,
            Capabilities = new SpeechProviderCapabilities
            {
                RequiresApiKey = caps.RequiresApiKey,
                SupportsVoiceListing = caps.SupportsVoiceListing,
                SupportsStreaming = caps.SupportsStreaming,
            },
        };
    }

    #endregion
}
