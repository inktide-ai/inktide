using Inktide.API.Memory.Domain.Models;

namespace Inktide.API.Memory.Application.Interfaces;

public interface IIngestionDlqPublisher
{
    Task PublishAsync(MemoryIngestionJob job, string errorMessage, CancellationToken ct = default);
}
