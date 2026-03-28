using System.Text.Json.Serialization;

namespace Chimera.API.Memory.Infrastructure.Clients;

// ── Embedding ──────────────────────────────────────────────────────────

internal sealed class EmbedRequest
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

internal sealed class EmbedBatchRequest
{
    [JsonPropertyName("texts")]
    public List<string> Texts { get; set; } = [];
}

internal sealed class EmbedResponse
{
    [JsonPropertyName("embedding")]
    public float[] Embedding { get; set; } = [];

    [JsonPropertyName("dim")]
    public int Dim { get; set; }
}

internal sealed class EmbedBatchResponse
{
    [JsonPropertyName("embeddings")]
    public List<float[]> Embeddings { get; set; } = [];

    [JsonPropertyName("dim")]
    public int Dim { get; set; }
}

// ── Fact extraction ────────────────────────────────────────────────────

internal sealed class UserMessageDto
{
    [JsonPropertyName("sender")]
    public string Sender { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

internal sealed class ConversationTurnRequest
{
    [JsonPropertyName("userMessage")]
    public UserMessageDto UserMessage { get; set; } = new();

    [JsonPropertyName("botResponse")]
    public string BotResponse { get; set; } = string.Empty;

    [JsonPropertyName("platform")]
    public string? Platform { get; set; }

    [JsonPropertyName("channelId")]
    public string? ChannelId { get; set; }

    [JsonPropertyName("timestamp")]
    public DateTimeOffset? Timestamp { get; set; }
}

internal sealed class ExtractedFactDto
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "fact";

    [JsonPropertyName("entities")]
    public List<string> Entities { get; set; } = [];

    [JsonPropertyName("importance")]
    public double Importance { get; set; }
}

internal sealed class FactExtractionResponseDto
{
    [JsonPropertyName("facts")]
    public List<ExtractedFactDto> Facts { get; set; } = [];
}
