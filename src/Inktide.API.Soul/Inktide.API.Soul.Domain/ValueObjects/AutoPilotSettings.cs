using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class AutoPilotSettings
{

    [JsonPropertyName("idle_timeout_seconds")]
    public int IdleTimeoutSeconds { get; set; } = 300;

    [JsonPropertyName("min_interval_seconds")]
    public int MinIntervalSeconds { get; set; } = 60;

    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = false;

    public static AutoPilotSettings Parse(string? json) => ValueObjectJson.ParseOrDefault<AutoPilotSettings>(json);

}
