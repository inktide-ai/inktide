using System.Runtime.CompilerServices;
using System.Threading.Channels;
using Inktide.API.Connector.Application.Models;
using Inktide.API.Connector.Infrastructure.Messaging;

namespace Inktide.API.Connector.Infrastructure.Messaging;

/// <summary>
/// Bounded in-memory buffer between chat connectors (producers) and Redis stream publisher (consumer).
/// Drops oldest messages under backpressure to keep the pipeline moving.
/// </summary>
public sealed class ChatMessageChannel : IChatMessageQueue
{

    private readonly Channel<ChatMessage> _channel;


    public ChatMessageChannel(int capacity = 10000)
    {
        _channel = Channel.CreateBounded<ChatMessage>(new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });
    }


    public ChannelWriter<ChatMessage> Writer => _channel.Writer;
    public ChannelReader<ChatMessage> Reader => _channel.Reader;


    public bool TryEnqueue(ChatMessage message) =>
        _channel.Writer.TryWrite(message);

    public async IAsyncEnumerable<ChatMessage> ConsumeAllAsync(
        [EnumeratorCancellation] CancellationToken ct)
    {
        await foreach (var message in _channel.Reader.ReadAllAsync(ct))
        {
            yield return message;
        }
    }

}
