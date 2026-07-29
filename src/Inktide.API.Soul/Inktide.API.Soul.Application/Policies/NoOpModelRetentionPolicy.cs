using Inktide.API.Soul.Application.Interfaces;

namespace Inktide.API.Soul.Application.Policies;

/// <summary>
/// Keeps all uploaded models - no cleanup on upload.
/// Active model is managed explicitly via SetActiveAsync.
/// OCP: swap this registration to restore single-model behavior.
/// </summary>
public sealed class NoOpModelRetentionPolicy : IModelRetentionPolicy
{
    public Task EnforceAsync(Guid userId, Guid cardId, Guid newModelId, CancellationToken ct = default)
        => Task.CompletedTask;
}
