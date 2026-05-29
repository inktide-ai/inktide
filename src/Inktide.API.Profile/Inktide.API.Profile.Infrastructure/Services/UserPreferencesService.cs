using Inktide.API.Profile.Application.Entities;
using Inktide.API.Profile.Application.Interfaces;

namespace Inktide.API.Profile.Infrastructure.Services;

public sealed class UserPreferencesService : IUserPreferencesService
{
    private readonly IUserPreferencesRepository _repo;

    public UserPreferencesService(IUserPreferencesRepository repo) => _repo = repo;

    public async Task<UserPreferencesGlobal> GetGlobalAsync(string userId, CancellationToken ct = default)
    {
        var prefs = await _repo.FindAsync(userId, ct).ConfigureAwait(false)
            ?? UserPreferences.Defaults(userId);

        return new(prefs.Appearance, prefs.Language, prefs.Notifications, prefs.Favorites);
    }

    public async Task<UserPreferencesGlobal> PatchGlobalAsync(
        string userId,
        AppearancePrefs? appearance,
        string? language,
        NotifPrefs? notifications,
        string[]? favorites,
        CancellationToken ct = default)
    {
        var prefs = await _repo.FindAsync(userId, ct).ConfigureAwait(false)
            ?? UserPreferences.Defaults(userId);

        prefs.ApplyGlobal(appearance, language, notifications, favorites);
        await _repo.UpsertAsync(prefs, ct).ConfigureAwait(false);

        return new(prefs.Appearance, prefs.Language, prefs.Notifications, prefs.Favorites);
    }

    public async Task<UserPreferencesWorkspace> GetWorkspaceAsync(string userId, string characterId, CancellationToken ct = default)
    {
        var prefs = await _repo.FindAsync(userId, ct).ConfigureAwait(false);
        if (prefs is null) return new(null, null);

        return new(prefs.GetHubLayout(characterId), prefs.GetSceneSettings(characterId));
    }

    public async Task<UserPreferencesWorkspace> PatchWorkspaceAsync(
        string userId,
        string characterId,
        string? hubLayout,
        string? sceneSettings,
        CancellationToken ct = default)
    {
        var prefs = await _repo.FindAsync(userId, ct).ConfigureAwait(false)
            ?? UserPreferences.Defaults(userId);

        prefs.ApplyWorkspace(characterId, hubLayout, sceneSettings);
        await _repo.UpsertAsync(prefs, ct).ConfigureAwait(false);

        return new(prefs.GetHubLayout(characterId), prefs.GetSceneSettings(characterId));
    }
}
