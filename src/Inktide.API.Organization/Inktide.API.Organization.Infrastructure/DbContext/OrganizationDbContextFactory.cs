using Inktide.API.Core.EfCore;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

namespace Inktide.API.Organization.Infrastructure.DbContext;

public sealed class OrganizationDbContextFactory : InktideDbContextFactory<OrganizationDbContext>
{
    protected override OrganizationDbContext CreateContext(DbContextOptions<OrganizationDbContext> options)
        => new(options);

    protected override void ConfigureNpgsql(NpgsqlDbContextOptionsBuilder builder)
        => builder.MigrationsHistoryTable("__ef_org_migrations", "organization");
}
