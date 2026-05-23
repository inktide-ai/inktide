using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Messaging;

internal interface IChatMessageProcessor
{
    Task ProcessAsync(IDatabase db, StreamEntry entry, CancellationToken ct);
}
