using Newtonsoft.Json;

namespace Inktide.API.Soul.REST.Models;

public sealed class SoulPublicActivityFeedResponse
{
    [JsonProperty("items")]
    public IReadOnlyList<SoulPublicActivityFeedItem> Items { get; set; } = [];

    [JsonProperty("next_cursor")]
    public string? NextCursor { get; set; }
}

public sealed class SoulPublicActivityFeedItem
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    [JsonProperty("event_type")]
    public string EventType { get; set; } = string.Empty;

    [JsonProperty("emoji")]
    public string Emoji { get; set; } = string.Empty;

    [JsonProperty("copy")]
    public string RenderedCopy { get; set; } = string.Empty;

    [JsonProperty("occurred_at")]
    public DateTime OccurredAt { get; set; }
}
