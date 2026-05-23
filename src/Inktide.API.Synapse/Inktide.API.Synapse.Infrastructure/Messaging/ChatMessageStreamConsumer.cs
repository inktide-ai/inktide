using Inktide.API.Core.Settings;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Messaging;

internal sealed class ChatMessageStreamConsumer : BackgroundService
{
    private readonly IChatMessageProcessor _processor;
    private readonly RedisStreamConnectionMonitor _monitor;
    private readonly RedisConsumerGroupInitializer _groupInit;
    private readonly RedisStreamAutoClaimer _autoClaimer;
    private readonly IConnectionMultiplexer _redis;
    private readonly SynapseIngestStreamSettings _settings;
    private readonly ILogger<ChatMessageStreamConsumer> _logger;
    private readonly string _consumerName;


    public ChatMessageStreamConsumer(
        IChatMessageProcessor processor,
        RedisStreamConnectionMonitor monitor,
        RedisConsumerGroupInitializer groupInit,
        RedisStreamAutoClaimer autoClaimer,
        IConnectionMultiplexer redis,
        IOptions<SynapseIngestStreamSettings> settings,
        ILogger<ChatMessageStreamConsumer> logger)
    {
        _processor   = processor   ?? throw new ArgumentNullException(nameof(processor));
        _monitor     = monitor     ?? throw new ArgumentNullException(nameof(monitor));
        _groupInit   = groupInit   ?? throw new ArgumentNullException(nameof(groupInit));
        _autoClaimer = autoClaimer ?? throw new ArgumentNullException(nameof(autoClaimer));
        _redis       = redis       ?? throw new ArgumentNullException(nameof(redis));
        _settings    = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger      = logger      ?? throw new ArgumentNullException(nameof(logger));

        var instanceId = SynapseIngestStreamSettings.ResolveConsumerInstanceId();
        _consumerName = _settings.FormatConsumerName(instanceId);
    }


    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await _monitor.WaitForRedisAvailableAsync(stoppingToken);

            var db = _redis.GetDatabase();
            await _groupInit.EnsureAsync(db, stoppingToken);

            _logger.LogInformation(
                "ChatMessageStreamConsumer started. Stream={Stream} Group={Group} Consumer={Consumer}",
                _settings.StreamName, _settings.ConsumerGroup, _consumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                _autoClaimer.RunAsync(db, _consumerName, stoppingToken));

            _logger.LogInformation("ChatMessageStreamConsumer stopped.");
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("ChatMessageStreamConsumer cancelled.");
        }
    }


    private async Task ConsumeLoopAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var entries = await db.StreamReadGroupAsync(
                    _settings.StreamName,
                    _settings.ConsumerGroup,
                    _consumerName,
                    position: null,
                    count: _settings.ReadCount,
                    noAck: false,
                    flags: CommandFlags.None);

                if (entries.Length == 0)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(_settings.ReadBlockMilliseconds), ct);
                    continue;
                }

                foreach (var entry in entries)
                    await _processor.ProcessAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (RedisException ex) when (RedisStreamConnectionMonitor.IsConnectionIssue(ex))
            {
                _logger.LogWarning(
                    "Synapse ingest: Redis read interrupted ({Reason}). Reconnecting...",
                    RedisStreamConnectionMonitor.GetErrorSummary(ex));
                await _monitor.WaitForRedisAvailableAsync(ct);
            }
        }
    }
}
