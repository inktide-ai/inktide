using Inktide.API.Project.Application.Interfaces;

namespace Inktide.API.Project.Infrastructure.Services;

internal sealed class LocalTtsProviderClassifier : ILocalTtsProviderClassifier
{
    private static readonly HashSet<string> LocalProviders =
        new(StringComparer.OrdinalIgnoreCase) { "kokoro", "piper", "coqui" };

    public bool IsLocal(string? providerId) =>
        providerId is not null && LocalProviders.Contains(providerId);
}
