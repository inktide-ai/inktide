using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Soul.Infrastructure.DbContext;

/// <summary>
/// Provides a <see cref="SoulDbContext"/> for EF Core design-time tooling (migrations, scaffolding).
/// Required because the runtime context is registered via DryIoc, which the EF design-time
/// host cannot resolve without this factory.
/// </summary>
public sealed class SoulDbContextFactory : IDesignTimeDbContextFactory<SoulDbContext>
{

    public SoulDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(FindAppSettingsDir())
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var pg = config.GetSection("PostgresSettings");
        var connStr = config.GetConnectionString("Soul")
            ?? $"Host={pg["Host"] ?? "localhost"};"
             + $"Port={pg["Port"] ?? "5432"};"
             + $"Database={pg["Database"] ?? "inktide"};"
             + $"Username={pg["Username"] ?? "postgres"};"
             + $"Password={pg["Password"] ?? ""}";

        var opts = new DbContextOptionsBuilder<SoulDbContext>()
            .UseNpgsql(connStr)
            .Options;

        return new SoulDbContext(opts);
    }


    // Walk up from the Infrastructure project to find the API host's appsettings.json.
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
