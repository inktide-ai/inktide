using Inktide.API.Profile.Application.Entities;
using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Profile.Infrastructure.Repositories;

public sealed class UserProfileRepository : IUserProfileRepository
{
    private readonly ProfileDbContext _db;

    public UserProfileRepository(ProfileDbContext db) => _db = db;

    public async Task<string?> GetAvatarUrlAsync(string userId, CancellationToken ct = default)
    {
        var profile = await _db.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            .ConfigureAwait(false);
        return profile?.AvatarUrl;
    }

    public async Task UpsertAvatarUrlAsync(string userId, string avatarUrl, CancellationToken ct = default)
    {
        var profile = await _db.UserProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            .ConfigureAwait(false);

        if (profile is null)
            _db.UserProfiles.Add(new UserProfile { UserId = userId, AvatarUrl = avatarUrl });
        else
            profile.AvatarUrl = avatarUrl;

        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task DeleteAsync(string userId, CancellationToken ct = default)
    {
        await _db.UserProfiles
            .Where(p => p.UserId == userId)
            .ExecuteDeleteAsync(ct)
            .ConfigureAwait(false);
    }
}
