using Inktide.API.Profile.Application.Entities;
using Inktide.API.Profile.Application.Interfaces;
using Inktide.API.Profile.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Profile.Infrastructure.Repositories;

public sealed class UserPreferencesRepository : IUserPreferencesRepository
{
    private readonly ProfileDbContext _db;

    public UserPreferencesRepository(ProfileDbContext db) => _db = db;

    public async Task<UserPreferences?> FindAsync(string userId, CancellationToken ct = default)
        => await _db.UserPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            .ConfigureAwait(false);

    public async Task UpsertAsync(UserPreferences prefs, CancellationToken ct = default)
    {
        var existing = await _db.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == prefs.UserId, ct)
            .ConfigureAwait(false);

        if (existing is null)
            _db.UserPreferences.Add(prefs);
        else
            _db.Entry(existing).CurrentValues.SetValues(prefs);

        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
