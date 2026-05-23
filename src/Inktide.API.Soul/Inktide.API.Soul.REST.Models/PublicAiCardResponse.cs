using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

/// <summary>
/// Trimmed soul view for unauthenticated public profile pages.
/// Does NOT include system_prompt, llm_config, tts_config, or credentials.
/// </summary>
public sealed class PublicAiCardResponse
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonProperty("description")]
    public string Description { get; set; } = string.Empty;

    [JsonProperty("avatar_url")]
    public string? AvatarUrl { get; set; }

    [JsonProperty("cover_url")]
    public string? CoverUrl { get; set; }

    [JsonProperty("personality")]
    public string Personality { get; set; } = string.Empty;

    [JsonProperty("status")]
    public string Status { get; set; } = "active";

    [JsonProperty("is_active")]
    public bool IsActive { get; set; }

    [JsonProperty("platforms")]
    public IReadOnlyList<string> Platforms { get; set; } = [];

    [JsonProperty("created_at")]
    public DateTime CreatedAt { get; set; }
}
