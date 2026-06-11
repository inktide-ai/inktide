namespace Inktide.API.Marketplace.Application.Interfaces;

public interface IProjectOwnershipChecker
{
    Task<bool> OwnsProjectAsync(Guid projectId, CancellationToken ct);
}
