using System.Threading.Channels;
using Chimera.API.Memory.Domain.Models;
using Chimera.API.Memory.Domain.Ports;

namespace Chimera.API.Memory.Application.Services;

public sealed class MemoryIngestionService : IMemoryIngestionService
{
    private readonly Channel<MemoryIngestionJob> _channel;

    public MemoryIngestionService(Channel<MemoryIngestionJob> channel)
        => _channel = channel;

    public ValueTask EnqueueAsync(MemoryIngestionJob job, CancellationToken ct = default)
        => _channel.Writer.WriteAsync(job, ct);
}
