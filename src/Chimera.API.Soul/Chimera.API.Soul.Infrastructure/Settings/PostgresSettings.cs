using System.ComponentModel;

namespace Chimera.API.Soul.Infrastructure.Settings;

public sealed class PostgresSettings
{
    #region Fields

    private string _host = "localhost";
    private ushort _port = 5432;
    private string _database = "postgres";
    private string _username = string.Empty;
    private string _password = string.Empty;
    private int _maxPoolSize = 200;
    private int _minPoolSize = 10;

    #endregion

    #region Properties

    [DefaultValue("localhost")]
    public string Host
    {
        get => _host;
        set => _host = value;
    }

    [DefaultValue(5432)]
    public ushort Port
    {
        get => _port;
        set => _port = value;
    }

    [DefaultValue("postgres")]
    public string Database
    {
        get => _database;
        set => _database = value;
    }

    public string Username
    {
        get => _username;
        set => _username = value;
    }

    public string Password
    {
        get => _password;
        set => _password = value;
    }

    [DefaultValue(200)]
    public int MaxPoolSize
    {
        get => _maxPoolSize;
        set => _maxPoolSize = value;
    }

    [DefaultValue(10)]
    public int MinPoolSize
    {
        get => _minPoolSize;
        set => _minPoolSize = value;
    }

    #endregion

    #region Public Methods

    public string ToConnectionString() =>
        $"Host={_host};Port={_port};Database={_database};Username={_username};Password={_password};" +
        $"Pooling=true;Minimum Pool Size={_minPoolSize};Maximum Pool Size={_maxPoolSize}";

    #endregion
}
