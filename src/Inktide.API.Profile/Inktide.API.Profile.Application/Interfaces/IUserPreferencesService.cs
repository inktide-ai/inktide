using Inktide.API.Profile.Application.Entities;

namespace Inktide.API.Profile.Application.Interfaces;

public interface IUserPreferencesService
{
    Task<UserPreferencesGlobal> GetGlobalAsync(string userId, CancellationToken ct = default);
    Task<UserPreferencesGlobal> PatchGlobalAsync(string userId, AppearancePrefs? appearance, string? language, NotifPrefs? notifications, string[]? favorites, CancellationToken ct = default);
    Task<UserPreferencesWorkspace> GetWorkspaceAsync(string userId, string characterId, CancellationToken ct = default);
    Task<UserPreferencesWorkspace> PatchWorkspaceAsync(string userId, string characterId, string? hubLayout, string? sceneSettings, CancellationToken ct = default);
}

public record UserPreferencesGlobal(
    AppearancePrefs Appearance,
    string Language,
    NotifPrefs Notifications,
    string[] Favorites);

public record UserPreferencesWorkspace(
    string? HubLayout,
    string? SceneSettings);
