using System.ComponentModel;

namespace Chimera.ApiGateway.Infrastructure.Settings;

/// <summary>
/// PostgreSQL configuration. Sensitive values (especially Password) should come from
/// environment variables or User Secrets, not from committed config files.
/// </summary>
/// <remarks>
/// <para>Environment variables (override appsettings):</para>
/// <list type="bullet">
///   <item>ConnectionStrings__Postgres — full connection string (highest priority)</item>
///   <item>POSTGRES_PASSWORD — password only</item>
///   <item>PostgresSettings__Host, PostgresSettings__Port, etc.</item>
/// </list>
/// <para>Local dev: use User Secrets or appsettings.Development.User.json (gitignored).</para>
/// </remarks>
public sealed class PostgresSettings
{
    private string _host = "localhost";
    private ushort _port = 5432;
    private string _database = "wormhole";
    private string _username = "wormhole";
    private string _password = string.Empty;
    private int _maxPoolSize = 200;
    private int _minPoolSize = 10;

    /// <summary>PostgreSQL host.</summary>
    [DefaultValue("localhost")]
    public string Host
    {
        get => _host;
        set => _host = string.IsNullOrWhiteSpace(value) ? "localhost" : value.Trim();
    }

    /// <summary>PostgreSQL port.</summary>
    [DefaultValue(5432)]
    public ushort Port
    {
        get => _port;
        set => _port = value;
    }

    /// <summary>Database name.</summary>
    [DefaultValue("wormhole")]
    public string Database
    {
        get => _database;
        set => _database = string.IsNullOrWhiteSpace(value) ? "wormhole" : value.Trim();
    }

    /// <summary>Username.</summary>
    [DefaultValue("wormhole")]
    public string Username
    {
        get => _username;
        set => _username = string.IsNullOrWhiteSpace(value) ? "wormhole" : value.Trim();
    }

    /// <summary>Password. Prefer env POSTGRES_PASSWORD or PostgresSettings__Password.</summary>
    public string Password
    {
        get => _password;
        set => _password = value ?? string.Empty;
    }

    /// <summary>Max pool size. Default 200 for high load (10k+ RPS).</summary>
    [DefaultValue(200)]
    public int MaxPoolSize
    {
        get => _maxPoolSize;
        set => _maxPoolSize = value;
    }

    /// <summary>Min pool size. Default 10 for faster cold start.</summary>
    [DefaultValue(10)]
    public int MinPoolSize
    {
        get => _minPoolSize;
        set => _minPoolSize = value;
    }

    /// <summary>
    /// Builds Npgsql connection string. Password must be set (from config or env).
    /// </summary>
    public string ToConnectionString()
    {
        var cs = $"Host={Host};Port={Port};Database={Database};Username={Username};Password={Password};Pooling=true;Minimum Pool Size={MinPoolSize};Maximum Pool Size={MaxPoolSize}";
        return cs;
    }
}
