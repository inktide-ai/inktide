using System.Text.Json;
using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Project.Infrastructure.Persistence.Configurations;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<ProjectEntity>
{
    public void Configure(EntityTypeBuilder<ProjectEntity> b)
    {
        b.ToTable("projects", "project");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
        b.Property(e => e.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        b.Property(e => e.Description).HasColumnName("description");
        b.Property(e => e.ActiveSoulId).HasColumnName("active_soul_id");
        b.Property(e => e.ActiveModelId).HasColumnName("active_model_id");
        b.Property(e => e.ActiveSceneId).HasColumnName("active_scene_id");
        b.Property(e => e.SystemPrompt).HasColumnName("system_prompt");
        b.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.SortKey)
            .HasColumnName("sort_key")
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue("a0");

        b.Property(e => e.Plugins)
            .HasColumnName("plugins_json")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<ProjectPlugin>>(v, (JsonSerializerOptions?)null) ?? new List<ProjectPlugin>())
            .IsRequired();

        b.HasIndex(e => e.UserId).HasDatabaseName("idx_projects_user_id");
        b.HasIndex(e => e.ActiveSoulId).HasDatabaseName("idx_projects_active_soul_id");
        b.HasIndex(e => new { e.UserId, e.SortKey })
            .HasDatabaseName("idx_projects_sort")
            .IsUnique();
    }
}
