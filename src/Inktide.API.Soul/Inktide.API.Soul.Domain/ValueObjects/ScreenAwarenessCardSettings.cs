using System.Text.Json;
using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class ScreenAwarenessCardSettings
{

    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = false;

    /// <summary>Per-card hourly frame budget override. 0 = use plan default.</summary>
    [JsonPropertyName("hourly_budget_override")]
    public int HourlyBudgetOverride { get; set; } = 0;

    /// <summary>pHash Hamming distance threshold. Frames with distance below this are deduplicated.</summary>
    [JsonPropertyName("phash_threshold")]
    public int PHashThreshold { get; set; } = 10;

    public static ScreenAwarenessCardSettings Parse(string? json) => ValueObjectJson.ParseOrDefault<ScreenAwarenessCardSettings>(json);

    public string ToJson() => JsonSerializer.Serialize(this, ValueObjectJson.Opts);

}
