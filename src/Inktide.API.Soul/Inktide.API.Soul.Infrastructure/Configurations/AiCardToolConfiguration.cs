using Inktide.API.Soul.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Soul.Infrastructure.Configurations;

public sealed class AiCardToolConfiguration : IEntityTypeConfiguration<AiCardTool>
{

    public void Configure(EntityTypeBuilder<AiCardTool> b)
    {
        b.ToTable("ai_card_tools", "soul");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id)
            .HasColumnName("id");

        b.Property(e => e.AiCardId)
            .HasColumnName("ai_card_id")
            .IsRequired();

        b.Property(e => e.ToolName)
            .HasColumnName("tool_name")
            .IsRequired();

        b.Property(e => e.ToolConfig)
            .HasColumnName("tool_config")
            .HasColumnType("jsonb")
            .IsRequired();

        b.Property(e => e.IsEnabled)
            .HasColumnName("is_enabled")
            .HasDefaultValue(true);

        b.Property(e => e.CreatedAt)
            .HasColumnName("created_at");

        b.HasIndex(e => e.AiCardId)
            .HasDatabaseName("idx_ai_card_tools_card");

        b.HasIndex(e => new { e.AiCardId, e.ToolName })
            .IsUnique();
    }

}
