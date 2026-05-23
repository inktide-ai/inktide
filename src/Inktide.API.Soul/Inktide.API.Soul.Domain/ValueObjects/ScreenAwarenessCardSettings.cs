using System.Text.Json;
using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class ScreenAwarenessCardSettings
{

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = false;

    /// <summary>Per-card hourly frame budget override. 0 = use plan default.</summary>
    [JsonPropertyName("hourly_budget_override")]
    public int HourlyBudgetOverride { get; set; } = 0;

    /// <summary>pHash Hamming distance threshold. Frames with distance below this are deduplicated.</summary>
    [JsonPropertyName("phash_threshold")]
    public int PHashThreshold { get; set; } = 10;

    public static ScreenAwarenessCardSettings Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new ScreenAwarenessCardSettings();
        try { return JsonSerializer.Deserialize<ScreenAwarenessCardSettings>(json, JsonOpts) ?? new ScreenAwarenessCardSettings(); }
        catch { return new ScreenAwarenessCardSettings(); }
    }

    public string ToJson() => JsonSerializer.Serialize(this, JsonOpts);

}
