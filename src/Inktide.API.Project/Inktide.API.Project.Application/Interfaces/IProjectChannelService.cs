using Inktide.API.Project.Domain.Entities;

namespace Inktide.API.Project.Application.Interfaces;

public interface IProjectChannelService
{
    Task<IReadOnlyList<ProjectChannel>> ListAsync(Guid projectId, Guid userId, CancellationToken ct = default);
    Task<ProjectChannel?> GetByIdAsync(Guid projectId, Guid channelId, CancellationToken ct = default);
    Task<ProjectChannel> CreateAsync(Guid projectId, string platform, string channelName, CancellationToken ct = default);
    Task<ProjectChannel?> PatchAsync(Guid projectId, Guid channelId, bool? isActive, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid projectId, Guid channelId, Guid userId, CancellationToken ct = default);
}
