using Inktide.API.Core.EfCore;
using Microsoft.EntityFrameworkCore;

namespace Inktide.API.Memory.Infrastructure.DbContext;

public sealed class MemoryDbContextFactory : InktideDbContextFactory<MemoryDbContext>
{
    protected override MemoryDbContext CreateContext(DbContextOptions<MemoryDbContext> options)
        => new(options);
}
