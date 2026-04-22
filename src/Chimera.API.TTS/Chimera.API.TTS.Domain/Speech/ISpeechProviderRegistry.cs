using System.Diagnostics.CodeAnalysis;
using Chimera.API.TTS.Domain.Models;

namespace Chimera.API.TTS.Domain.Speech;

/// <summary>
/// Read-only catalog of speech (TTS) providers, built at startup from DI-registered <see cref="ISpeechProvider"/> instances.
/// </summary>
public interface ISpeechProviderRegistry
{

    IReadOnlyDictionary<string, SpeechProviderDescriptor> Descriptors { get; }

    IReadOnlyList<ISpeechProvider> All { get; }


    ISpeechProvider GetRequired(string providerId);

    bool TryGet(string providerId, [NotNullWhen(true)] out ISpeechProvider? provider);

}
