using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Infrastructure.Persistence.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Persistence;

public sealed class ProjectDbContext : DbContext
{
    public ProjectDbContext(DbContextOptions<ProjectDbContext> options) : base(options) { }

    public DbSet<ProjectEntity>    Projects       => Set<ProjectEntity>();
    public DbSet<ProjectTool>      Tools          => Set<ProjectTool>();
    public DbSet<ProjectScene>     Scenes         => Set<ProjectScene>();
    public DbSet<ProjectChannel>   ProjectChannels  { get; set; }
    public DbSet<ProjectRunPreset> ProjectRunPresets { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new ProjectConfiguration());
        modelBuilder.ApplyConfiguration(new ProjectToolConfiguration());
        modelBuilder.ApplyConfiguration(new ProjectSceneConfiguration());
        modelBuilder.ApplyConfiguration(new ProjectChannelConfiguration());
        modelBuilder.ApplyConfiguration(new ProjectRunPresetConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
