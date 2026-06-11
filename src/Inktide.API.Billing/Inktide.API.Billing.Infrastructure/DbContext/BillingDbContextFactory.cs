using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Billing.Infrastructure.DbContext;

/// <summary>
/// Provides a <see cref="BillingDbContext"/> for EF Core design-time tooling (migrations, scaffolding).
/// </summary>
public sealed class BillingDbContextFactory : IDesignTimeDbContextFactory<BillingDbContext>
{
    public BillingDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(FindAppSettingsDir())
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var pg = config.GetSection("PostgresSettings");
        var connStr = config.GetConnectionString("DefaultConnection")
            ?? $"Host={pg["Host"] ?? "localhost"};"
             + $"Port={pg["Port"] ?? "5432"};"
             + $"Database={pg["Database"] ?? "inktide"};"
             + $"Username={pg["Username"] ?? "postgres"};"
             + $"Password={pg["Password"] ?? ""}";

        var opts = new DbContextOptionsBuilder<BillingDbContext>()
            .UseNpgsql(connStr, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_billing_migrations", "billing"))
            .Options;

        return new BillingDbContext(opts);
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
