using Inktide.API.Soul.Application.Interfaces;

namespace Inktide.API.Soul.Infrastructure.Queries;

/// <summary>
/// Stub - AiCardRunPreset has been removed from the Soul domain.
/// Run presets will move to the Project context.
/// Returns null (no active preset) until the migration is complete.
/// </summary>
public sealed class AiCardRunPresetQueryService : IAiCardRunPresetQueryService
{
    public Task<ActiveRunPresetDto?> GetActiveForCardAsync(Guid cardId, CancellationToken ct = default)
        => Task.FromResult<ActiveRunPresetDto?>(null);
}
