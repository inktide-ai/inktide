using Inktide.API.Connector.Application.Contracts;
using Inktide.API.Connector.Application.Interfaces;
using Inktide.API.Core.Messages;
using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Inktide.API.Connector.Infrastructure.Messaging;

public sealed class SoulStatusChangedMTConsumer : IConsumer<SoulStatusChangedMessage>
{
    private readonly IEnumerable<IChatConnector> _connectors;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SoulStatusChangedMTConsumer> _logger;

    public SoulStatusChangedMTConsumer(
        IEnumerable<IChatConnector> connectors,
        IServiceScopeFactory scopeFactory,
        ILogger<SoulStatusChangedMTConsumer> logger)
    {
        _connectors   = connectors   ?? throw new ArgumentNullException(nameof(connectors));
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _logger       = logger       ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task Consume(ConsumeContext<SoulStatusChangedMessage> context)
    {
        var msg = context.Message;
        var ct  = context.CancellationToken;

        await using var scope = _scopeFactory.CreateAsyncScope();
        var channelService = scope.ServiceProvider.GetRequiredService<IConnectorChannelService>();

        var channels = await channelService.GetByCardIdAsync(msg.CardId, ct).ConfigureAwait(false);
        var activeChannels = channels
            .Where(c => c.IsActive && !string.IsNullOrEmpty(c.ChannelId))
            .ToList();

        var isStart = msg.IsActive &&
                      string.Equals(msg.Status, "Active", StringComparison.OrdinalIgnoreCase);

        foreach (var channel in activeChannels)
        {
            var connector = _connectors.FirstOrDefault(c =>
                string.Equals(c.PlatformId, channel.Platform, StringComparison.OrdinalIgnoreCase));

            if (connector is null)
            {
                _logger.LogDebug("No connector for platform {Platform} — skipping channel {Channel}",
                    channel.Platform, channel.ChannelId);
                continue;
            }

            if (isStart)
                await connector.JoinChannelAsync(channel.ChannelId!, msg.CardId, ct).ConfigureAwait(false);
            else
                await connector.LeaveChannelAsync(channel.ChannelId!, msg.CardId, ct).ConfigureAwait(false);
        }

        _logger.LogInformation(
            "SoulStatusChangedMTConsumer: processed soul {CardId} → IsActive={IsActive} Status={Status}",
            msg.CardId, msg.IsActive, msg.Status);
    }
}
