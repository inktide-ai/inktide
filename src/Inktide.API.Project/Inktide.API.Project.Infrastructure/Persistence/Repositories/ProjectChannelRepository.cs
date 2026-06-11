using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Persistence.Repositories;

internal sealed class ProjectChannelRepository(ProjectDbContext db) : IProjectChannelRepository
{
    public async Task<IReadOnlyList<ProjectChannel>> GetByProjectAsync(Guid projectId, Guid userId, CancellationToken ct)
        => await db.ProjectChannels
            .Where(c => c.ProjectId == projectId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);

    public Task<ProjectChannel?> GetByIdAsync(Guid projectId, Guid channelId, CancellationToken ct)
        => db.ProjectChannels.FirstOrDefaultAsync(c => c.ProjectId == projectId && c.Id == channelId, ct);

    public async Task AddAsync(ProjectChannel channel, CancellationToken ct)
    {
        db.ProjectChannels.Add(channel);
        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid channelId, Guid userId, CancellationToken ct)
    {
        var deleted = await db.ProjectChannels
            .Where(c => c.ProjectId == projectId && c.Id == channelId)
            .ExecuteDeleteAsync(ct);
        return deleted > 0;
    }

    public Task SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
