using Inktide.API.Project.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inktide.API.Project.Infrastructure.Persistence.Configurations;

public sealed class ProjectToolConfiguration : IEntityTypeConfiguration<ProjectTool>
{
    public void Configure(EntityTypeBuilder<ProjectTool> b)
    {
        b.ToTable("project_tools", "project");
        b.HasKey(e => e.Id);

        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.ProjectId).HasColumnName("project_id").IsRequired();
        b.Property(e => e.ToolName).HasColumnName("tool_name").IsRequired();
        b.Property(e => e.ToolConfig).HasColumnName("tool_config").HasColumnType("jsonb");
        b.Property(e => e.IsEnabled).HasColumnName("is_enabled").IsRequired();
        b.Property(e => e.CreatedAt).HasColumnName("created_at");

        b.HasIndex(e => e.ProjectId).HasDatabaseName("idx_project_tools_project_id");
    }
}
