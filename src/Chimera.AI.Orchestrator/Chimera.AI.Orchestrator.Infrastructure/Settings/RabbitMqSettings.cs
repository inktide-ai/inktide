using System.ComponentModel.DataAnnotations;

namespace Chimera.AI.Orchestrator.Infrastructure.Settings;

public sealed class RabbitMqSettings
{
    [Required(AllowEmptyStrings = false)]
    public string Host { get; set; } = "localhost";

    public int Port { get; set; } = 5672;

    public string Username { get; set; } = "guest";

    public string Password { get; set; } = "guest";

    public string VirtualHost { get; set; } = "/";

    public string Exchange { get; set; } = "chimera.streaming";

    public string RoutingKey { get; set; } = "chat.message";

    public string QueueName { get; set; } = "stream_input";

    /// <summary>
    /// Prefetch count — how many unacknowledged messages the broker will deliver at once.
    /// </summary>
    public ushort PrefetchCount { get; set; } = 64;
}
