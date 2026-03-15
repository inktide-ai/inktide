using Chimera.API.Synapse.Application.Interfaces;
    
namespace Chimera.API.Synapse.Application.Pipeline;

public sealed class PipelineType<T>
{
    private readonly List<IPipelineStep<T>> _steps = new();
    private Func<T, bool>? _abortPredicate;

    public PipelineType<T> AddStep(IPipelineStep<T> step)
    {
        _steps.Add(step);
        return this;
    }

    /// <summary>
    /// Stops execution early when the predicate returns true.
    /// Multiple calls are composed with OR logic.
    /// Example: .AbortWhen(ctx => ctx.IsAborted)
    /// </summary>
    public PipelineType<T> AbortWhen(Func<T, bool> predicate)
    {
        _abortPredicate = _abortPredicate is null
            ? predicate
            : input => _abortPredicate(input) || predicate(input);
        return this;
    }

    public async Task<T> ExecuteAsync(T input, CancellationToken ct = default)
    {
        var result = input;

        foreach (var step in _steps)
        {
            if (_abortPredicate?.Invoke(result) == true) break;
            result = await step.ProcessAsync(result, ct);
        }

        return result;
    }
}
