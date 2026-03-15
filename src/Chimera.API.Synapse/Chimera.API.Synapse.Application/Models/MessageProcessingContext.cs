namespace Chimera.API.Synapse.Application.Models;

public sealed class MessageProcessingContext
{
    public required ChatMessage Message { get; init; }
        
    private readonly Dictionary<Type, object> _data = new();

    public void Set<T>(T value) where T : class => _data[typeof(T)] = value;

    public T? Get<T>() where T : class =>
        _data.TryGetValue(typeof(T), out var value) ? (T)value : null;

    public bool IsAborted { get; private set; }

    public void Abort() => IsAborted = true;
    
}