using Inktide.API.Project.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Project.Infrastructure.Persistence.Configurations;

public sealed class ProjectSceneConfiguration : IEntityTypeConfiguration<ProjectScene>
{
    public void Configure(EntityTypeBuilder<ProjectScene> b)
    {
        b.ToTable("project_scenes", "project");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.ProjectId).HasColumnName("project_id").IsRequired();
        b.Property(e => e.StorageKey).HasColumnName("storage_key").IsRequired();
        b.Property(e => e.PublicUrl).HasColumnName("public_url");
        b.Property(e => e.OriginalName).HasColumnName("original_name");
        b.Property(e => e.ContentType).HasColumnName("content_type");
        b.Property(e => e.SizeBytes).HasColumnName("size_bytes");
        b.Property(e => e.DisplayName).HasColumnName("display_name");
        b.Property(e => e.Description).HasColumnName("description");
        b.Property(e => e.SortKey).HasColumnName("sort_key");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");

        b.HasIndex(e => e.ProjectId).HasDatabaseName("idx_project_scenes_project_id");
    }
}
