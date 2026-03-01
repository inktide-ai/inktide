using RabbitMQ.Client;

namespace Chimera.ApiGateway.Infrastructure.Messaging;

/// <summary>Provides a reusable RabbitMQ channel and reports connection health.</summary>
public interface IRabbitMqChannelProvider : IAsyncDisposable
{
    /// <summary>Returns true when the underlying connection is open.</summary>
    bool IsConnected { get; }

    /// <summary>Returns a live channel, creating the connection and declaring topology on first call.</summary>
    Task<IChannel> GetChannelAsync(CancellationToken ct = default);
}
