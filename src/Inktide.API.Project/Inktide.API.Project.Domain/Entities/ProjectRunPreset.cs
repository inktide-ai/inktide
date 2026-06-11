using Inktide.API.Core.Generators;
namespace Inktide.API.Project.Domain.Entities;

public sealed class ProjectRunPreset
{
    private ProjectRunPreset() { }

    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? Icon { get; private set; }
    public bool IsActive { get; private set; }
    public string? OverrideLlmModelId { get; private set; }
    public float? OverrideTemperature { get; private set; }
    public string? OverrideEmotionPresetId { get; private set; }
    public string? OverrideVoiceProfileId { get; private set; }
    public string SortKey { get; private set; } = "a0";
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public ProjectEntity? Project { get; private set; }

    public static ProjectRunPreset Create(
        Guid projectId, string name, string? description, string? icon,
        string? overrideLlmModelId, float? overrideTemperature,
        string? overrideEmotionPresetId, string? overrideVoiceProfileId, string sortKey)
    {
        if (projectId == Guid.Empty) throw new ArgumentException("projectId required.", nameof(projectId));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("name required.", nameof(name));
        if (string.IsNullOrEmpty(sortKey)) throw new ArgumentException("sortKey required.", nameof(sortKey));
        var now = DateTime.UtcNow;
        return new ProjectRunPreset
        {
            Id = IdGenerator.New(), ProjectId = projectId,
            Name = name.Trim(), Description = Trim(description), Icon = Trim(icon),
            IsActive = false, SortKey = sortKey,
            OverrideLlmModelId = Trim(overrideLlmModelId),
            OverrideTemperature = overrideTemperature,
            OverrideEmotionPresetId = Trim(overrideEmotionPresetId),
            OverrideVoiceProfileId = Trim(overrideVoiceProfileId),
            CreatedAt = now, UpdatedAt = now,
        };
    }

    public void SetSortKey(string key) { SortKey = key; UpdatedAt = DateTime.UtcNow; }
    public void Activate() { IsActive = true; UpdatedAt = DateTime.UtcNow; }
    public void Deactivate() { IsActive = false; UpdatedAt = DateTime.UtcNow; }
    public void Update(string name, string? description, string? icon,
        string? llmModelId, float? temperature, string? emotionPresetId, string? voiceProfileId)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("name required.", nameof(name));
        Name = name.Trim(); Description = Trim(description); Icon = Trim(icon);
        OverrideLlmModelId = Trim(llmModelId); OverrideTemperature = temperature;
        OverrideEmotionPresetId = Trim(emotionPresetId); OverrideVoiceProfileId = Trim(voiceProfileId);
        UpdatedAt = DateTime.UtcNow;
    }
    private static string? Trim(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}
