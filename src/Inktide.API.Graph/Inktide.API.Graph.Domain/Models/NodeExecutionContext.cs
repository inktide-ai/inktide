namespace Inktide.API.Graph.Domain.Models;

/// <summary>
/// Passed to <see cref="Contracts.INodeHandler.ExecuteAsync"/> for each node invocation.
/// Inputs are the resolved outputs of upstream nodes; Config is the saved node configuration.
/// </summary>
public sealed class NodeExecutionContext
{
    private readonly Dictionary<string, object> _outputs = new();

    public NodeExecutionContext(
        IReadOnlyDictionary<string, object> inputs,
        IReadOnlyDictionary<string, object> config,
        IServiceProvider services)
    {
        Inputs = inputs;
        Config = config;
        Services = services;
    }

    public IReadOnlyDictionary<string, object> Inputs { get; }

    public IReadOnlyDictionary<string, object> Config { get; }

    public IServiceProvider Services { get; }

    public void SetOutput(string portName, object value) => _outputs[portName] = value;

    public IReadOnlyDictionary<string, object> GetOutputs() => _outputs;

    public T? GetInput<T>(string portName) =>
        Inputs.TryGetValue(portName, out var v) && v is T typed ? typed : default;

    public T? GetConfig<T>(string key) =>
        Config.TryGetValue(key, out var v) && v is T typed ? typed : default;
}
