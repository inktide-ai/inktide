using Inktide.API.Organization.Application.Entities;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Organization.Infrastructure.DbContext;

public sealed class OrganizationDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public DbSet<Application.Entities.Organization> Organizations { get; set; } = null!;
    public DbSet<OrganizationMember> OrganizationMembers { get; set; } = null!;
    public DbSet<OrganizationInvite> OrganizationInvites { get; set; } = null!;

    public OrganizationDbContext(DbContextOptions<OrganizationDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new Configurations.OrganizationConfiguration());
        modelBuilder.ApplyConfiguration(new Configurations.OrganizationMemberConfiguration());
        modelBuilder.ApplyConfiguration(new Configurations.OrganizationInviteConfiguration());
    }
}
