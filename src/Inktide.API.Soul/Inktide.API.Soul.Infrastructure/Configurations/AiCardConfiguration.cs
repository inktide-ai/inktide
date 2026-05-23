using System.Text.Json;
using Inktide.API.Soul.Domain.Entities;
using Inktide.API.Soul.Domain.Enums;
using Inktide.API.Soul.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class AiCardConfiguration : IEntityTypeConfiguration<AiCard>
{

    private static readonly JsonSerializerOptions PersonalityJsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    public void Configure(EntityTypeBuilder<AiCard> b)
    {
        b.ToTable("ai_cards", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        b.Property(e => e.Name)
            .HasColumnName("name")
            .IsRequired();

        b.Property(e => e.Slug)
            .HasColumnName("slug")
            .IsRequired();

        b.Property(e => e.AvatarUrl)
            .HasColumnName("avatar_url");

        b.Property(e => e.Personality)
            .HasColumnName("personality")
            .IsRequired()
            .HasDefaultValue("");

        b.Property(e => e.SystemPrompt)
            .HasColumnName("system_prompt")
            .IsRequired();

        b.Property(e => e.LlmCatalogId)
            .HasColumnName("llm_catalog_id")
            .IsRequired();

        b.Property(e => e.LlmConfig)
            .HasColumnName("llm_config")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.TtsCatalogId)
            .HasColumnName("tts_catalog_id");

        b.Property(e => e.TtsConfig)
            .HasColumnName("tts_config")
            .HasColumnType("jsonb");

        b.Property(e => e.Appearance)
            .HasColumnName("appearance")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.ResponseBehavior)
            .HasColumnName("response_behavior")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.MemorySettings)
            .HasColumnName("memory_settings")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.AutoPilot)
            .HasColumnName("auto_pilot")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.ScreenAwarenessSettings)
            .HasColumnName("screen_awareness_settings")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasDefaultValueSql("'{}'");

        b.Property(e => e.PersonalityConfig)
            .HasColumnName("personality_config")
            .HasColumnType("jsonb")
            .IsRequired()
            .HasDefaultValueSql("'{}'")
            .HasConversion(
                v => JsonSerializer.Serialize(v, PersonalityJsonOpts),
                v => string.IsNullOrWhiteSpace(v)
                    ? new PersonalitySettings()
                    : JsonSerializer.Deserialize<PersonalitySettings>(v, PersonalityJsonOpts) ?? new PersonalitySettings());

        b.Property(e => e.Description)
            .HasColumnName("description")
            .IsRequired()
            .HasDefaultValue("");

        // Store as lowercase string to preserve existing DB data ("active", "private").
        // Case-insensitive parsing handles legacy rows if casing ever differs.
        b.Property(e => e.Status)
            .HasColumnName("status")
            .HasConversion(
                new ValueConverter<AiCardStatus, string>(
                    v => v.ToString().ToLower(),
                    s => Enum.Parse<AiCardStatus>(s, ignoreCase: true)))
            .IsRequired()
            .HasDefaultValue(AiCardStatus.Active);

        b.Property(e => e.CoverUrl)
            .HasColumnName("cover_url");

        b.Property(e => e.Visibility)
            .HasColumnName("visibility")
            .HasConversion(
                new ValueConverter<AiCardVisibility, string>(
                    v => v.ToString().ToLower(),
                    s => Enum.Parse<AiCardVisibility>(s, ignoreCase: true)))
            .IsRequired()
            .HasDefaultValue(AiCardVisibility.Private);

        b.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        b.Property(e => e.DeletedAt)
            .HasColumnName("deleted_at");

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at");

        b.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at");

        b.Property(e => e.SortKey)
            .HasColumnName("sort_key")
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue("a0");

        b.HasIndex(e => new { e.UserId, e.SortKey })
            .HasDatabaseName("idx_ai_cards_sort")
            .IsUnique()
            .HasFilter("deleted_at IS NULL");

        b.HasIndex(e => e.UserId)
            .HasDatabaseName("idx_ai_cards_user_id");

        b.HasIndex(e => new { e.UserId, e.Slug })
            .IsUnique();

        b.HasIndex(e => new { e.UserId, e.IsActive })
            .HasDatabaseName("idx_ai_cards_user_active")
            .HasFilter("is_active = true AND deleted_at IS NULL");

        b.HasIndex(e => e.DeletedAt)
            .HasDatabaseName("idx_ai_cards_deleted_at")
            .HasFilter("deleted_at IS NULL");

        b.HasOne(e => e.LlmCatalog)
            .WithMany()
            .HasForeignKey(e => e.LlmCatalogId);

        b.HasOne(e => e.TtsCatalog)
            .WithMany()
            .HasForeignKey(e => e.TtsCatalogId);

        b.HasMany(e => e.Channels)
            .WithOne(c => c.AiCard)
            .HasForeignKey(c => c.AiCardId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasMany(e => e.Tools)
            .WithOne(t => t.AiCard)
            .HasForeignKey(t => t.AiCardId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}
