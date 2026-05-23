using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Marketplace.Infrastructure.DbContext;

public sealed class MarketplaceDbContextFactory : IDesignTimeDbContextFactory<MarketplaceDbContext>
{
    public MarketplaceDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(FindAppSettingsDir())
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var pg = config.GetSection("PostgresSettings");
        var connStr = config.GetConnectionString("Postgres")
            ?? $"Host={pg["Host"] ?? "localhost"};"
             + $"Port={pg["Port"] ?? "5432"};"
             + $"Database={pg["Database"] ?? "inktide"};"
             + $"Username={pg["Username"] ?? "postgres"};"
             + $"Password={pg["Password"] ?? ""}";

        var opts = new DbContextOptionsBuilder<MarketplaceDbContext>()
            .UseNpgsql(connStr)
            .Options;

        return new MarketplaceDbContext(opts);
    }

    private static string FindAppSettingsDir()
    {
        var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "src", "Inktide.API");
            if (Directory.Exists(candidate)) return candidate;
            dir = dir.Parent;
        }
        return Directory.GetCurrentDirectory();
    }
}
