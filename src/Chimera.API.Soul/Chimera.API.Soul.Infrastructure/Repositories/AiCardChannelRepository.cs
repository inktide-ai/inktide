using Chimera.API.Soul.Domain.Entities;
using Chimera.API.Soul.Domain.Repositories;
using Chimera.API.Soul.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Chimera.API.Soul.Infrastructure.Repositories;

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
            .ToListAsync(ct);
    }

    public async Task<AiCardChannel?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCardChannels.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<AiCardChannel?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AiCardChannels.FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<AiCardChannel> CreateAsync(AiCardChannel channel, CancellationToken ct = default)
    {
        _db.AiCardChannels.Add(channel);
        await _db.SaveChangesAsync(ct);
        return channel;
    }

    public async Task UpdateAsync(AiCardChannel channel, CancellationToken ct = default)
    {
        _db.AiCardChannels.Update(channel);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var channel = await _db.AiCardChannels.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (channel is not null)
        {
            _db.AiCardChannels.Remove(channel);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<IReadOnlyList<AiCardChannel>> GetActiveByPlatformAsync(string platform, CancellationToken ct = default)
    {
        return await _db.AiCardChannels
            .AsNoTracking()
            .Where(c => c.Platform == platform && c.IsActive)
            .ToListAsync(ct);
    }

}
