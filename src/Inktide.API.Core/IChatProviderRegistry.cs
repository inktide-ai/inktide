using System.Diagnostics.CodeAnalysis;
using Inktide.API.Domain.Models;

namespace Inktide.API.Core;

public interface IChatProviderRegistry
{

    IReadOnlyDictionary<string, ChatProviderDescriptor> Descriptors { get; }

    IReadOnlyList<IChatProvider> All { get; }


    IChatProvider GetRequired(string providerId);

    bool TryGet(string providerId, [NotNullWhen(true)] out IChatProvider? provider);

}
