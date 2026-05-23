using Inktide.API.Project.Domain.Entities;
using Inktide.API.Project.Infrastructure.Persistence.Configurations;
using Inktide.API.Project.Infrastructure.Persistence.ReadModels;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Persistence;

public sealed class ProjectDbContext : DbContext
{
    public ProjectDbContext(DbContextOptions<ProjectDbContext> options) : base(options) { }

    public DbSet<ProjectEntity> Projects => Set<ProjectEntity>();

    internal DbSet<CardSummaryReadModel> CardSummaries => Set<CardSummaryReadModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new ProjectConfiguration());
        modelBuilder.ApplyConfiguration(new CardSummaryConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
