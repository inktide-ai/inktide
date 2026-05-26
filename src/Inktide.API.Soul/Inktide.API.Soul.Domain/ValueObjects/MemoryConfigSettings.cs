using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class MemoryConfigSettings
{

    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("max_memories")]
    public int MaxMemories { get; set; } = 5;

    [JsonPropertyName("retention_days")]
    public int RetentionDays { get; set; } = 90;

    [JsonPropertyName("importance_threshold")]
    public float ImportanceThreshold { get; set; } = 0.5f;

    public static MemoryConfigSettings Parse(string? json) => ValueObjectJson.ParseOrDefault<MemoryConfigSettings>(json);

}
