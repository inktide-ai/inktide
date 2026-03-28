namespace Chimera.API.Memory.Domain.Models;

/// <summary>
/// Payload written to the ingestion channel after each conversation turn.
/// Processed asynchronously by <c>MemoryIngestionWorker</c>.
/// </summary>
public sealed record MemoryIngestionJob(
    Guid AiCardId,
    string ChannelId,
    string Platform,
    string UserMessage,
    string BotResponse,
    string SenderName,
    DateTimeOffset Timestamp);
