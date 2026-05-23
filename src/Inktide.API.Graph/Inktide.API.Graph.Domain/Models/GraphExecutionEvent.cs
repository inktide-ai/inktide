namespace Inktide.API.Graph.Domain.Models;

public abstract record GraphExecutionEvent;

public sealed record NodeStartedEvent(string NodeId) : GraphExecutionEvent;

public sealed record NodeCompletedEvent(
    string NodeId,
    IReadOnlyDictionary<string, object> Outputs) : GraphExecutionEvent;

public sealed record NodeFailedEvent(string NodeId, string ErrorMessage) : GraphExecutionEvent;

public sealed record GraphCompletedEvent : GraphExecutionEvent;
