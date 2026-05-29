using Inktide.API.Profile.Application.Entities;

namespace Inktide.API.Profile.Application.Interfaces;

public interface IUserPreferencesRepository
{
    Task<UserPreferences?> FindAsync(string userId, CancellationToken ct = default);
    Task UpsertAsync(UserPreferences prefs, CancellationToken ct = default);
}
