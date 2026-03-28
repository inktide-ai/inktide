using Chimera.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chimera.API.Soul.Infrastructure.Configurations;

public sealed class AiCardConfiguration : IEntityTypeConfiguration<AiCard>
{
    #region Public Methods

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

        b.Property(e => e.Behavior)
            .HasColumnName("behavior")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.MemorySettings)
            .HasColumnName("memory_settings")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.DonkeyEngine)
            .HasColumnName("donkey_engine")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at");

        b.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at");

        b.HasIndex(e => e.UserId)
            .HasDatabaseName("idx_ai_cards_user_id");

        b.HasIndex(e => new { e.UserId, e.Slug })
            .IsUnique();

        b.HasIndex(e => new { e.UserId, e.IsActive })
            .HasDatabaseName("idx_ai_cards_user_active")
            .HasFilter("is_active = true");

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

    #endregion
}
