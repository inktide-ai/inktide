using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Repositories;
using Inktide.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Soul.Infrastructure.Repositories;

public sealed class AiCardChannelRepository : IAiCardChannelRepository
{

    private readonly SoulDbContext _db;


    public AiCardChannelRepository(SoulDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }


    public async Task<IReadOnlyList<AiCardChannel>> GetByCardIdAsync(Guid aiCardId, CancellationToken ct = default)
    {
        return await _db.AiCardChannels
            .AsNoTracking()
            .Where(c => c.AiCardId == aiCardId)
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task<AiCardChannel?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCardChannels.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct).ConfigureAwait(false);
    }

    public async Task<AiCardChannel?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCardChannels.FirstOrDefaultAsync(c => c.Id == id, ct).ConfigureAwait(false);
    }

    public async Task<AiCardChannel?> GetByIdWithCardAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCardChannels
            .Include(c => c.AiCard)
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            .ConfigureAwait(false);
    }

    public Task<AiCardChannel> CreateAsync(AiCardChannel channel, CancellationToken ct = default)
    {
        _db.AiCardChannels.Add(channel);
        return Task.FromResult(channel);
    }

    public Task UpdateAsync(AiCardChannel channel, CancellationToken ct = default)
    {
        _db.AiCardChannels.Update(channel);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var channel = await _db.AiCardChannels.FirstOrDefaultAsync(c => c.Id == id, ct).ConfigureAwait(false);
        if (channel is not null)
            _db.AiCardChannels.Remove(channel);
    }

    public async Task<IReadOnlyList<AiCardChannel>> GetActiveByPlatformAsync(string platform, CancellationToken ct = default)
    {
        return await _db.AiCardChannels
            .AsNoTracking()
            .Where(c => c.Platform == platform && c.IsActive)
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AiCardChannel>> GetActiveDiscordChannelsAsync(CancellationToken ct = default)
    {
        return await _db.AiCardChannels
            .AsNoTracking()
            .Where(c => c.Platform == "discord" && c.IsActive && c.ChannelId != null)
            .ToListAsync(ct).ConfigureAwait(false);
    }

}
