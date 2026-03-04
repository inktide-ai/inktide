using System.ComponentModel.DataAnnotations;

namespace Chimera.AI.Orchestrator.Infrastructure.Settings;

public sealed class RabbitMqSettings
{
    #region Fields

    private string _host = "localhost";
    private int _port = 5672;
    private string _username = "guest";
    private string _password = "guest";
    private string _virtualHost = "/";
    private string _exchange = "chimera.streaming";
    private string _routingKey = "chat.message";
    private string _queueName = "stream_input";
    private ushort _prefetchCount = 64;

    #endregion

    #region Properties

    [Required(AllowEmptyStrings = false)]
    public string Host
    {
        get => _host;
        set => _host = value;
    }

    public int Port
    {
        get => _port;
        set => _port = value;
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

    public string VirtualHost
    {
        get => _virtualHost;
        set => _virtualHost = value;
    }

    public string Exchange
    {
        get => _exchange;
        set => _exchange = value;
    }

    public string RoutingKey
    {
        get => _routingKey;
        set => _routingKey = value;
    }

    public string QueueName
    {
        get => _queueName;
        set => _queueName = value;
    }

    /// <summary>Prefetch count — how many unacknowledged messages the broker will deliver at once.</summary>
    public ushort PrefetchCount
    {
        get => _prefetchCount;
        set => _prefetchCount = value;
    }

    #endregion
}
