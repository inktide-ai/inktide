using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class TtsCatalogConfiguration : IEntityTypeConfiguration<TtsCatalogEntry>
{

    public void Configure(EntityTypeBuilder<TtsCatalogEntry> b)
    {
        b.ToTable("tts_catalog", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.Provider)
            .HasColumnName("provider")
            .IsRequired();

        b.Property(e => e.VoiceId)
            .HasColumnName("voice_id")
            .IsRequired();

        b.Property(e => e.DisplayName)
            .HasColumnName("display_name")
            .IsRequired();

        b.Property(e => e.Language)
            .HasColumnName("language")
            .IsRequired()
            .HasDefaultValue("en");

        b.Property(e => e.Gender)
            .HasColumnName("gender");

        b.Property(e => e.SampleUrl)
            .HasColumnName("sample_url");

        b.Property(e => e.Tier)
            .HasColumnName("tier")
            .IsRequired()
            .HasDefaultValue("free");

        b.Property(e => e.IsAvailable)
            .HasColumnName("is_available")
            .HasDefaultValue(true);

        b.Property(e => e.RequiresApiKey)
            .HasColumnName("requires_api_key")
            .HasDefaultValue(true);

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at");

        b.HasIndex(e => new { e.Provider, e.VoiceId })
            .IsUnique();
    }

}
