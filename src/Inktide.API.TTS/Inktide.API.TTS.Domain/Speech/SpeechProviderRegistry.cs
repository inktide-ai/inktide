using System.Collections.ObjectModel;
using System.Diagnostics.CodeAnalysis;
using Inktide.API.Core;
using Inktide.API.TTS.Domain.Models;

namespace Inktide.API.TTS.Domain.Speech;

/// <summary>
/// Validates unique <see cref="IProvider.Id"/> and exposes <see cref="SpeechProviderDescriptor"/> for UI/catalog.
/// </summary>
public sealed class SpeechProviderRegistry : ISpeechProviderRegistry
{

    private readonly IReadOnlyDictionary<string, ISpeechProvider> _byId;
    private readonly IReadOnlyDictionary<string, SpeechProviderDescriptor> _descriptors;
    private readonly IReadOnlyList<ISpeechProvider> _all;


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


    public IReadOnlyDictionary<string, SpeechProviderDescriptor> Descriptors => _descriptors;

    public IReadOnlyList<ISpeechProvider> All => _all;


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


    private static SpeechProviderDescriptor BuildDescriptor(ISpeechProvider provider) =>
        new(provider.Id, provider.Name, provider.Capabilities);

}
