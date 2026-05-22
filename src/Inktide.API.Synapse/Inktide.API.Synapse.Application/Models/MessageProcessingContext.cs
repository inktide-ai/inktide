namespace Inktide.API.Synapse.Application.Models;

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

    private readonly System.Collections.Concurrent.ConcurrentBag<string> _degradedShards = new();
    public bool IsDegraded => !_degradedShards.IsEmpty;
    public IReadOnlyCollection<string> DegradedShards => _degradedShards;
    public void MarkDegraded(string shardId) => _degradedShards.Add(shardId);

    /// <summary>
    /// Set by <see cref="ISoulRuntime"/> when it successfully executed plugin nodes from the
    /// soul's saved graph. Checked by the orchestrator to decide whether to fall back to
    /// the legacy hardcoded scatter shards.
    /// </summary>
    public bool SoulRuntimeExecuted { get; private set; }
    public void MarkSoulRuntimeExecuted() => SoulRuntimeExecuted = true;
}