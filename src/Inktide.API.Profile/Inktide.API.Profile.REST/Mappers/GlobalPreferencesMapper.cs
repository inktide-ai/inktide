using Inktide.API.Profile.Application.Entities;
using static Inktide.API.Profile.REST.Controllers.MeController;

namespace Inktide.API.Profile.REST.Mappers;

internal static class GlobalPreferencesMapper
{
    internal static AppearancePrefs? ToAppearancePrefs(AppearancePrefDto? dto) =>
        dto is null ? null : new AppearancePrefs(
            dto.Theme        ?? AppearancePrefs.Default.Theme,
            dto.AccentColor  ?? AppearancePrefs.Default.AccentColor,
            dto.FontSize     ?? AppearancePrefs.Default.FontSize,
            dto.Compact      ?? AppearancePrefs.Default.Compact,
            dto.ReduceMotion ?? AppearancePrefs.Default.ReduceMotion);

    internal static NotifPrefs? ToNotifPrefs(NotifPrefDto? dto) =>
        dto is null ? null : new NotifPrefs(
            dto.Enabled             ?? NotifPrefs.Default.Enabled,
            dto.EmailMentions       ?? NotifPrefs.Default.EmailMentions,
            dto.EmailMessages       ?? NotifPrefs.Default.EmailMessages,
            dto.EmailProjectUpdates ?? NotifPrefs.Default.EmailProjectUpdates,
            dto.EmailSystem         ?? NotifPrefs.Default.EmailSystem,
            dto.PushMentions        ?? NotifPrefs.Default.PushMentions,
            dto.PushMessages        ?? NotifPrefs.Default.PushMessages,
            dto.PushReminders       ?? NotifPrefs.Default.PushReminders);
}
