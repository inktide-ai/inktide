using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

namespace Inktide.API.Core.EfCore;

/// <summary>
/// Base <see cref="IDesignTimeDbContextFactory{TContext}"/> for all Inktide bounded contexts.
/// Eliminates the copy-pasted <c>BuildConnectionString</c> + <c>FindAppSettingsDir</c> pattern
/// that was duplicated across every Infrastructure project.
/// Subclasses override only <see cref="CreateContext"/> (and optionally <see cref="ConfigureNpgsql"/>
/// for schema-scoped migration history tables).
/// </summary>
public abstract class InktideDbContextFactory<TContext> : IDesignTimeDbContextFactory<TContext>
    where TContext : DbContext
{
    public TContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(FindAppSettingsDir())
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connStr = config.GetConnectionString("Postgres")
                   ?? BuildConnectionString(config);

        var opts = new DbContextOptionsBuilder<TContext>()
            .UseNpgsql(connStr, ConfigureNpgsql)
            .Options;

        return CreateContext(opts);
    }

    protected abstract TContext CreateContext(DbContextOptions<TContext> options);

    protected virtual void ConfigureNpgsql(NpgsqlDbContextOptionsBuilder builder) { }

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
