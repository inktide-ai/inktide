namespace Chimera.API.Synapse.Application.Interfaces;

public interface IPipelineStep<T>
{
    Task<T> ProcessAsync(T input, CancellationToken ct = default);
}
