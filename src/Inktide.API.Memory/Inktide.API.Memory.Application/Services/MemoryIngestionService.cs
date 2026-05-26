using System.Threading.Channels;
using Inktide.API.Memory.Domain.Models;
using Inktide.API.Memory.Domain.Ports;

namespace Inktide.API.Memory.Application.Services;

public sealed class MemoryIngestionService : IMemoryIngestionService
{
    private readonly Channel<MemoryIngestionJob> _channel;

    public MemoryIngestionService(Channel<MemoryIngestionJob> channel)
        => _channel = channel ?? throw new ArgumentNullException(nameof(channel));

    public ValueTask EnqueueAsync(MemoryIngestionJob job, CancellationToken ct = default)
        => _channel.Writer.WriteAsync(job, ct);
}
