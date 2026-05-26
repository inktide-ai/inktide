using Inktide.API.Marketplace.Infrastructure.Helpers;
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

        var connStr = PostgresConnectionStringResolver.Resolve(config, throwIfPasswordMissing: false);

        var opts = new DbContextOptionsBuilder<MarketplaceDbContext>()
            .UseNpgsql(connStr)
            .Options;

        return new MarketplaceDbContext(opts);
    }

    private static string FindAppSettingsDir()
    {
        var envPath = Environment.GetEnvironmentVariable("EF_MIGRATION_SETTINGS_PATH");
        if (!string.IsNullOrEmpty(envPath) && Directory.Exists(envPath)) return envPath;

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
