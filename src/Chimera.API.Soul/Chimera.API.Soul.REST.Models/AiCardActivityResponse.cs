using Newtonsoft.Json;

namespace Chimera.API.Soul.REST.Models;

public sealed class AiCardActivityItem
{
    [JsonProperty("id")]
    public Guid Id { get; set; }

    [JsonProperty("action")]
    public string Action { get; set; } = string.Empty;

    [JsonProperty("created_at")]
    public DateTime CreatedAt { get; set; }
}
