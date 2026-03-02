using System.ComponentModel.DataAnnotations;

namespace Chimera.ApiGateway.Infrastructure.Settings;

public sealed class RabbitMqSettings
{
    private string _host = "localhost";
    private int _port = 5672;
    private string _username = "guest";
    private string _password = "guest";
    private string _virtualHost = "/";
    private string _exchange = "chimera.streaming";
    private string _routingKey = "chat.message";
    private string _queueName = "stream_input";

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

    /// <summary>
    /// Exchange to publish chat messages to.
    /// </summary>
    public string Exchange
    {
        get => _exchange;
        set => _exchange = value;
    }

    /// <summary>
    /// Routing key for chat messages.
    /// </summary>
    public string RoutingKey
    {
        get => _routingKey;
        set => _routingKey = value;
    }

    /// <summary>
    /// Queue name that binds to the exchange (auto-created on startup).
    /// </summary>
    public string QueueName
    {
        get => _queueName;
        set => _queueName = value;
    }
}
