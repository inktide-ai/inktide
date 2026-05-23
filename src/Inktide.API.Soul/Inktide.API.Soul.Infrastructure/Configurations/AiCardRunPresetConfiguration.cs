using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class AiCardRunPresetConfiguration : IEntityTypeConfiguration<AiCardRunPreset>
{

    public void Configure(EntityTypeBuilder<AiCardRunPreset> b)
    {
        b.ToTable("ai_card_run_presets", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
        b.Property(e => e.AiCardId).HasColumnName("ai_card_id").IsRequired();

        b.Property(e => e.Name)
            .HasColumnName("name")
            .IsRequired()
            .HasMaxLength(200);

        b.Property(e => e.Description)
            .HasColumnName("description")
            .HasMaxLength(1000);

        b.Property(e => e.Icon)
            .HasColumnName("icon")
            .HasMaxLength(64);

        b.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(false);

        b.Property(e => e.OverrideLlmModelId)
            .HasColumnName("override_llm_model_id")
            .HasMaxLength(200);

        b.Property(e => e.OverrideTemperature)
            .HasColumnName("override_temperature");

        b.Property(e => e.OverrideEmotionPresetId)
            .HasColumnName("override_emotion_preset_id")
            .HasMaxLength(100);

        b.Property(e => e.OverrideVoiceProfileId)
            .HasColumnName("override_voice_profile_id")
            .HasMaxLength(200);

        b.Property(e => e.SortKey)
            .HasColumnName("sort_key")
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue("a0");

        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");

        b.HasIndex(e => new { e.AiCardId, e.SortKey })
            .HasDatabaseName("idx_ai_card_run_presets_sort")
            .IsUnique();

        b.HasIndex(e => e.AiCardId)
            .HasDatabaseName("idx_ai_card_run_presets_card");

        b.HasIndex(e => new { e.UserId, e.AiCardId })
            .HasDatabaseName("idx_ai_card_run_presets_user_card");

        // Enforce at most one active preset per card at the DB level.
        b.HasIndex(e => new { e.AiCardId, e.IsActive })
            .HasDatabaseName("idx_ai_card_run_presets_active")
            .HasFilter("is_active = true")
            .IsUnique();

        b.HasOne(e => e.AiCard)
            .WithMany()
            .HasForeignKey(e => e.AiCardId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}
