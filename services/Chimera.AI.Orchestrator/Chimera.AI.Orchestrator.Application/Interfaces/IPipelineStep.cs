namespace Chimera.AI.Orchestrator.Application.Interfaces;

public interface IPipelineStep<T>
{
    Task<T> ProcessAsync(T input, CancellationToken ct = default);
}
