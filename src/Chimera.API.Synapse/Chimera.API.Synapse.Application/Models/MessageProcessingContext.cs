namespace Chimera.API.Synapse.Application.Models;

/// <summary>
/// Shared mutable bag for one Synapse ingest event. Scatter shards run concurrently and use
/// <see cref="Set{T}"/> / <see cref="Get{T}"/> (backed by <see cref="System.Collections.Concurrent.ConcurrentDictionary{TKey,TValue}"/>).
/// </summary>
public sealed class MessageProcessingContext
{
    public required ChatMessage Message { get; init; }

    /// <summary>Opaque transport message id assigned by the broker (e.g. Redis stream entry id, Kafka offset).</summary>
    public string TransportMessageId { get; set; } = string.Empty;

    /// <summary>Correlation id for logs and aggregate artifacts (defaults to <see cref="TransportMessageId"/>).</summary>
    public string CorrelationId { get; set; } = string.Empty;

    private readonly System.Collections.Concurrent.ConcurrentDictionary<Type, object> _data = new();

    public void Set<T>(T value) where T : class => _data[typeof(T)] = value;

    public T? Get<T>() where T : class =>
        _data.TryGetValue(typeof(T), out var value) ? (T)value : null;

    public bool IsAborted { get; private set; }

    public void Abort() => IsAborted = true;
    
}