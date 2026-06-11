using Inktide.API.Core.Ordering;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;

namespace Inktide.API.Project.Infrastructure.Services;

public sealed class ProjectRunPresetService(IProjectRunPresetRepository repo) : IProjectRunPresetService
{
    public Task<IReadOnlyList<ProjectRunPreset>> ListAsync(Guid projectId, CancellationToken ct = default)
        => repo.GetByProjectAsync(projectId, ct);

    public Task<ProjectRunPreset?> GetByIdAsync(Guid projectId, Guid presetId, CancellationToken ct = default)
        => repo.GetByIdAsync(projectId, presetId, ct);

    public async Task<ProjectRunPreset> CreateAsync(Guid projectId, string name, string? description, string? icon,
        string? overrideLlmModelId, float? overrideTemperature,
        string? overrideEmotionPresetId, string? overrideVoiceProfileId, CancellationToken ct = default)
    {
        var existing = await repo.GetByProjectAsync(projectId, ct);
        var sortKey  = FractionalIndexer.GenerateKeyBetween(
            existing.Count > 0 ? existing[^1].SortKey : null, null);

        var preset = ProjectRunPreset.Create(projectId, name, description, icon,
            overrideLlmModelId, overrideTemperature, overrideEmotionPresetId, overrideVoiceProfileId, sortKey);
        await repo.AddAsync(preset, ct);
        return preset;
    }

    public async Task<ProjectRunPreset?> UpdateAsync(Guid projectId, Guid presetId, string name, string? description, string? icon,
        string? overrideLlmModelId, float? overrideTemperature,
        string? overrideEmotionPresetId, string? overrideVoiceProfileId, CancellationToken ct = default)
    {
        var preset = await repo.GetByIdAsync(projectId, presetId, ct);
        if (preset is null) return null;
        preset.Update(name, description, icon, overrideLlmModelId, overrideTemperature, overrideEmotionPresetId, overrideVoiceProfileId);
        await repo.SaveAsync(ct);
        return preset;
    }

    public async Task ActivateAsync(Guid projectId, Guid presetId, CancellationToken ct = default)
    {
        var preset = await repo.GetByIdAsync(projectId, presetId, ct);
        if (preset is null) return;
        preset.Activate();
        await repo.SaveAsync(ct);
    }

    public async Task DeactivateAsync(Guid projectId, Guid presetId, CancellationToken ct = default)
    {
        var preset = await repo.GetByIdAsync(projectId, presetId, ct);
        if (preset is null) return;
        preset.Deactivate();
        await repo.SaveAsync(ct);
    }

    public Task<bool> DeleteAsync(Guid projectId, Guid presetId, CancellationToken ct = default)
        => repo.DeleteAsync(projectId, presetId, ct);
}
