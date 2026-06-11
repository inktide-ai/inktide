using Inktide.API.Core.Generators;
using Inktide.API.Project.Application.Interfaces;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;

namespace Inktide.API.Project.Infrastructure.Services;

public sealed class ProjectChannelService(IProjectChannelRepository repo) : IProjectChannelService
{
    public Task<IReadOnlyList<ProjectChannel>> ListAsync(Guid projectId, Guid userId, CancellationToken ct = default)
        => repo.GetByProjectAsync(projectId, userId, ct);

    public Task<ProjectChannel?> GetByIdAsync(Guid projectId, Guid channelId, CancellationToken ct = default)
        => repo.GetByIdAsync(projectId, channelId, ct);

    public async Task<ProjectChannel> CreateAsync(Guid projectId, string platform, string channelName, CancellationToken ct = default)
    {
        var channel = new ProjectChannel
        {
            Id          = IdGenerator.New(),
            ProjectId   = projectId,
            Platform    = platform,
            ChannelName = channelName,
            IsActive    = true,
            CreatedAt   = DateTime.UtcNow,
        };
        await repo.AddAsync(channel, ct);
        return channel;
    }

    public async Task<ProjectChannel?> PatchAsync(Guid projectId, Guid channelId, bool? isActive, CancellationToken ct = default)
    {
        var channel = await repo.GetByIdAsync(projectId, channelId, ct);
        if (channel is null) return null;
        if (isActive.HasValue) channel.IsActive = isActive.Value;
        await repo.SaveAsync(ct);
        return channel;
    }

    public Task<bool> DeleteAsync(Guid projectId, Guid channelId, Guid userId, CancellationToken ct = default)
        => repo.DeleteAsync(projectId, channelId, userId, ct);
}
