using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.Profile.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Profile.Infrastructure.Configurations;

public sealed class UserPreferencesConfiguration : IEntityTypeConfiguration<UserPreferences>
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public void Configure(EntityTypeBuilder<UserPreferences> b)
    {
        b.ToTable("user_preferences", "soul");
        b.HasKey(e => e.UserId);

        b.Property(e => e.UserId)
            .HasColumnName("user_id")
            .HasMaxLength(64)
            .IsRequired();

        b.Property(e => e.Appearance)
            .HasColumnName("appearance")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                s => JsonSerializer.Deserialize<AppearancePrefs>(s, JsonOpts) ?? AppearancePrefs.Default);

        b.Property(e => e.Language)
            .HasColumnName("language")
            .HasMaxLength(16)
            .IsRequired()
            .HasDefaultValue("en");

        b.Property(e => e.Notifications)
            .HasColumnName("notifications")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                s => JsonSerializer.Deserialize<NotifPrefs>(s, JsonOpts) ?? NotifPrefs.Default);

        b.Property(e => e.Favorites)
            .HasColumnName("favorites")
            .HasColumnType("text[]")
            .IsRequired();

        b.Property(e => e.HubLayouts)
            .HasColumnName("hub_layouts")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasDefaultValue("{}");

        b.Property(e => e.SceneSettings)
            .HasColumnName("scene_settings")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasDefaultValue("{}");

        b.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();
    }
}
