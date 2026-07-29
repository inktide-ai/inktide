using System.Text.Json;

namespace Inktide.API.Profile.Application.Entities;

public sealed class UserPreferences
{
    public string UserId { get; private set; } = string.Empty;
    public AppearancePrefs Appearance { get; private set; } = AppearancePrefs.Default;
    public string Language { get; private set; } = "en";
    public NotifPrefs Notifications { get; private set; } = NotifPrefs.Default;
    public string[] Favorites { get; private set; } = Array.Empty<string>();
    // Raw JSON maps keyed by characterId - Npgsql stores as JSONB
    public string HubLayouts { get; private set; } = "{}";
    public string SceneSettings { get; private set; } = "{}";
    public DateTimeOffset UpdatedAt { get; private set; }

    private UserPreferences() { }

    public static UserPreferences Defaults(string userId) => new()
    {
        UserId = userId,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public void ApplyGlobal(AppearancePrefs? appearance, string? language, NotifPrefs? notifications, string[]? favorites)
    {
        if (appearance is not null) Appearance = appearance;
        if (language is not null) Language = language;
        if (notifications is not null) Notifications = notifications;
        if (favorites is not null) Favorites = favorites;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ApplyWorkspace(string characterId, string? hubLayout, string? sceneSettings)
    {
        if (hubLayout is not null)
            HubLayouts = MergeKey(HubLayouts, characterId, hubLayout);
        if (sceneSettings is not null)
            SceneSettings = MergeKey(SceneSettings, characterId, sceneSettings);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public string? GetHubLayout(string characterId) => ExtractKey(HubLayouts, characterId);
    public string? GetSceneSettings(string characterId) => ExtractKey(SceneSettings, characterId);

    private static string? ExtractKey(string json, string key)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return null;
            return doc.RootElement.TryGetProperty(key, out var el) ? el.GetRawText() : null;
        }
        catch { return null; }
    }

    private static string MergeKey(string current, string key, string value)
    {
        Dictionary<string, JsonElement> map;
        try
        {
            using var doc = JsonDocument.Parse(current);
            map = doc.RootElement.ValueKind == JsonValueKind.Object
                ? doc.RootElement.EnumerateObject().ToDictionary(p => p.Name, p => p.Value.Clone())
                : new();
        }
        catch (JsonException ex)
        {
            // Stored JSON is corrupt - surface this so the caller can log and decide how to proceed.
            throw new InvalidOperationException("Workspace preference data is corrupt and cannot be updated.", ex);
        }

        using var valDoc = JsonDocument.Parse(value); // Throws JsonException for invalid caller input.
        map[key] = valDoc.RootElement.Clone();

        return JsonSerializer.Serialize(map);
    }
}

public sealed record AppearancePrefs(
    string Theme,
    string AccentColor,
    string FontSize,
    bool Compact,
    bool ReduceMotion)
{
    public static readonly AppearancePrefs Default = new("dark", "#6c47ff", "md", false, false);
}

public sealed record NotifPrefs(
    bool Enabled,
    bool EmailMentions,
    bool EmailMessages,
    bool EmailProjectUpdates,
    bool EmailSystem,
    bool PushMentions,
    bool PushMessages,
    bool PushReminders)
{
    public static readonly NotifPrefs Default = new(true, true, true, false, true, true, false, false);
}
