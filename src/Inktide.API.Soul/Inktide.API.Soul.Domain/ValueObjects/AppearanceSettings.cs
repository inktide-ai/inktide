using System.Text.Json.Serialization;

namespace Inktide.API.Soul.Domain.ValueObjects;

public sealed class AppearanceSettings
{

    [JsonPropertyName("schema_version")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("banner_color_index")]
    public int? BannerColorIndex { get; set; }

    [JsonPropertyName("model_type")]
    public string? ModelType { get; set; }

    [JsonPropertyName("model_file_name")]
    public string? ModelFileName { get; set; }

    public static AppearanceSettings Parse(string? json) => ValueObjectJson.ParseOrDefault<AppearanceSettings>(json);

}
