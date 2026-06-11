using Inktide.API.Core.EfCore;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Project.Infrastructure.Persistence;

public sealed class ProjectDbContextFactory : InktideDbContextFactory<ProjectDbContext>
{
    protected override ProjectDbContext CreateContext(DbContextOptions<ProjectDbContext> options)
        => new(options);
}
