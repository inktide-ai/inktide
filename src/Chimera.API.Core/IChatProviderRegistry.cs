using System.Diagnostics.CodeAnalysis;
using Chimera.API.Domain.Models;

namespace Chimera.API.Core;

/// <summary>
/// Read-only catalog of chat providers, built once at startup from DI-registered <see cref="IChatProvider"/> instances.
/// </summary>
public interface IChatProviderRegistry
{
    #region Properties

    IReadOnlyDictionary<string, ChatProviderDescriptor> Descriptors { get; }

    IReadOnlyList<IChatProvider> All { get; }

    #endregion

    #region Methods

    IChatProvider GetRequired(string providerId);

    bool TryGet(string providerId, [NotNullWhen(true)] out IChatProvider? provider);

    #endregion
}
