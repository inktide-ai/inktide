using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Application.Interfaces;

public interface IProjectRunPresetService
{
    Task<IReadOnlyList<ProjectRunPreset>> ListAsync(Guid projectId, CancellationToken ct = default);
    Task<ProjectRunPreset?> GetByIdAsync(Guid projectId, Guid presetId, CancellationToken ct = default);
    Task<ProjectRunPreset> CreateAsync(Guid projectId, string name, string? description, string? icon,
        string? overrideLlmModelId, float? overrideTemperature,
        string? overrideEmotionPresetId, string? overrideVoiceProfileId, CancellationToken ct = default);
    Task<ProjectRunPreset?> UpdateAsync(Guid projectId, Guid presetId, string name, string? description, string? icon,
        string? overrideLlmModelId, float? overrideTemperature,
        string? overrideEmotionPresetId, string? overrideVoiceProfileId, CancellationToken ct = default);
    Task ActivateAsync(Guid projectId, Guid presetId, CancellationToken ct = default);
    Task DeactivateAsync(Guid projectId, Guid presetId, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid projectId, Guid presetId, CancellationToken ct = default);
}
