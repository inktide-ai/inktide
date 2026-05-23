namespace Inktide.API.Core.Transactions;

/// <summary>
/// Abstraction over the integration event broker.
/// Current implementation: Redis Streams. Swap for Kafka by registering a different implementation.
/// </summary>
public interface IIntegrationEventPublisher
{
    Task PublishAsync(string eventType, string payload, CancellationToken ct = default);
}
