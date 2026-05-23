using Inktide.API.Core.Constants;
using Inktide.API.Core.Transactions;
using StackExchange.Redis;

namespace Inktide.API.Soul.Infrastructure.Messaging;

/// <summary>
/// Publishes integration events to Redis Streams.
/// To swap to Kafka: implement <see cref="IIntegrationEventPublisher"/> in a Kafka adapter
/// and replace this registration in DI — no other code changes needed.
/// </summary>
internal sealed class RedisStreamsIntegrationEventPublisher : IIntegrationEventPublisher
{
    private readonly IConnectionMultiplexer _redis;

    public RedisStreamsIntegrationEventPublisher(IConnectionMultiplexer redis)
        => _redis = redis ?? throw new ArgumentNullException(nameof(redis));

    public async Task PublishAsync(string eventType, string payload, CancellationToken ct)
    {
        var db = _redis.GetDatabase();
        await db.StreamAddAsync(
            StreamNames.IntegrationEvents,
            [
                new NameValueEntry("eventType", eventType),
                new NameValueEntry("payload",   payload),
            ],
            maxLength: 50_000).ConfigureAwait(false);
    }
}
