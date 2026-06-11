using Inktide.API.Core.EfCore;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Profile.Infrastructure.DbContext;

public sealed class ProfileDbContextFactory : InktideDbContextFactory<ProfileDbContext>
{
    protected override ProfileDbContext CreateContext(DbContextOptions<ProfileDbContext> options)
        => new(options);
}
