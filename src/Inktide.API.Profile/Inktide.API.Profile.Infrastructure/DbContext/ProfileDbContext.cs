using Inktide.API.Profile.Application.Entities;
using Inktide.API.Profile.Infrastructure.Configurations;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Profile.Infrastructure.DbContext;

public sealed class ProfileDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public ProfileDbContext(DbContextOptions<ProfileDbContext> options) : base(options) { }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<UserPreferences> UserPreferences => Set<UserPreferences>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserProfileConfiguration());
        modelBuilder.ApplyConfiguration(new UserPreferencesConfiguration());

        modelBuilder.AddInboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddOutboxStateEntity();

        base.OnModelCreating(modelBuilder);
    }
}
