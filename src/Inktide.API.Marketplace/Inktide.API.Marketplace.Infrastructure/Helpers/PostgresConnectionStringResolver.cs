using Microsoft.Extensions.Configuration;

namespace Inktide.API.Marketplace.Infrastructure.Helpers;

internal static class PostgresConnectionStringResolver
{
    public static string Resolve(IConfiguration configuration, bool throwIfPasswordMissing = true)
    {
        var full = configuration.GetConnectionString("Postgres");
        if (!string.IsNullOrWhiteSpace(full))
            return full.Trim();

        var host     = configuration["PostgresSettings:Host"]     ?? "localhost";
        var port     = configuration["PostgresSettings:Port"]     ?? "5432";
        var database = configuration["PostgresSettings:Database"] ?? "inktide";
        var username = configuration["PostgresSettings:Username"] ?? "postgres";
        var password = configuration["PostgresSettings:Password"]
            ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");

        if (throwIfPasswordMissing && string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException(
                "PostgreSQL password is not configured. Set PostgresSettings:Password or POSTGRES_PASSWORD.");

        return $"Host={host};Port={port};Database={database};Username={username};Password={password ?? ""}";
    }
}
