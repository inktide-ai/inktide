namespace Inktide.API.Synapse.Application.Models;

public sealed record SynapseMemoryIngestionRequest(
    Guid CharacterId,
    string ChannelId,
    string Platform,
    string UserMessage,
    string BotResponse,
    string SenderName,
    DateTimeOffset Timestamp);
