using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Inktide.API.Project.Domain.Entities;
namespace Inktide.API.Project.Infrastructure.Persistence.Configurations;

public sealed class ProjectRunPresetConfiguration : IEntityTypeConfiguration<ProjectRunPreset>
{
    public void Configure(EntityTypeBuilder<ProjectRunPreset> b)
    {
        b.ToTable("project_run_presets", "project");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ProjectId).HasColumnName("project_id").IsRequired();
        b.Property(x => x.Name).HasColumnName("name").IsRequired();
        b.Property(x => x.Description).HasColumnName("description");
        b.Property(x => x.Icon).HasColumnName("icon");
        b.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(false);
        b.Property(x => x.OverrideLlmModelId).HasColumnName("override_llm_model_id");
        b.Property(x => x.OverrideTemperature).HasColumnName("override_temperature");
        b.Property(x => x.OverrideEmotionPresetId).HasColumnName("override_emotion_preset_id");
        b.Property(x => x.OverrideVoiceProfileId).HasColumnName("override_voice_profile_id");
        b.Property(x => x.SortKey).HasColumnName("sort_key").HasMaxLength(100).HasDefaultValue("a0");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => x.ProjectId).HasDatabaseName("idx_project_run_presets_project_id");
    }
}
