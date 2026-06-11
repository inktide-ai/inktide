using Inktide.API.Project.Domain.Entities;
namespace Inktide.API.Project.Domain.Repositories;

public interface IProjectChannelRepository
{
    Task<IReadOnlyList<ProjectChannel>> GetByProjectAsync(Guid projectId, Guid userId, CancellationToken ct);
    Task<ProjectChannel?> GetByIdAsync(Guid projectId, Guid channelId, CancellationToken ct);
    Task AddAsync(ProjectChannel channel, CancellationToken ct);
    Task<bool> DeleteAsync(Guid projectId, Guid channelId, Guid userId, CancellationToken ct);
    Task SaveAsync(CancellationToken ct);
}
