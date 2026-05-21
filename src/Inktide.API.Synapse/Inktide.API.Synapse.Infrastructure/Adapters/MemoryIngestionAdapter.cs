using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Adapters;

public sealed class MemoryIngestionAdapter : IMemoryIngestionPort
{
    private readonly IMemoryIngestionService _ingestion;

    public MemoryIngestionAdapter(IMemoryIngestionService ingestion)
    {
        _ingestion = ingestion ?? throw new ArgumentNullException(nameof(ingestion));
    }

    public ValueTask EnqueueAsync(SynapseMemoryIngestionRequest request, CancellationToken ct = default)
    {
        var job = new MemoryIngestionJob(
            CharacterId: request.CharacterId,
            ChannelId:   request.ChannelId,
            Platform:    request.Platform,
            UserMessage: request.UserMessage,
            BotResponse: request.BotResponse,
            SenderName:  request.SenderName,
            Timestamp:   request.Timestamp);

        return _ingestion.EnqueueAsync(job, ct);
    }
}
