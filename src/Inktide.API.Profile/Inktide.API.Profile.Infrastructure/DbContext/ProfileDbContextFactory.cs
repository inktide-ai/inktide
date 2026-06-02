using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Inktide.API.Profile.Infrastructure.DbContext;

public sealed class ProfileDbContextFactory : IDesignTimeDbContextFactory<ProfileDbContext>
{
    public ProfileDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(FindAppSettingsDir())
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connStr = config.GetConnectionString("Postgres")
            ?? BuildConnectionString(config);

        var opts = new DbContextOptionsBuilder<ProfileDbContext>()
            .UseNpgsql(connStr)
            .Options;

        return new ProfileDbContext(opts);
    }

    private static string BuildConnectionString(IConfiguration cfg)
    {
        var host = cfg["PostgresSettings:Host"] ?? "localhost";
        var port = cfg["PostgresSettings:Port"] ?? "5432";
        var db   = cfg["PostgresSettings:Database"] ?? "inktide";
        var user = cfg["PostgresSettings:Username"] ?? "postgres";
        var pass = cfg["PostgresSettings:Password"] ?? "";
        return $"Host={host};Port={port};Database={db};Username={user};Password={pass}";
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
