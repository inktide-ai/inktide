using System.Text.Json;
using Inktide.API.Connector.Application.Models;
using Inktide.API.Core.Settings;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Connector.Infrastructure.Messaging;

/// <summary>
/// Drains the in-memory queue and appends JSON payloads to the Synapse ingest Redis stream (XADD).
/// </summary>
public sealed class RedisStreamPublisherWorker : BackgroundService
{



    private const int MaxRetries = 3;

    private const string QueueLabel = "synapse.ingest";

    private static readonly TimeSpan[] RetryDelays =
    [
        TimeSpan.FromMilliseconds(500),
        TimeSpan.FromSeconds(2),
        TimeSpan.FromSeconds(5)
    ];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly IChatMessageQueue _queue;
    private readonly IConnectionMultiplexer _redis;
    private readonly SynapseIngestStreamSettings _settings;
    private readonly ILogger<RedisStreamPublisherWorker> _logger;

    private long _publishedCount;
    private long _errorCount;


    public RedisStreamPublisherWorker(
        IChatMessageQueue queue,
        IConnectionMultiplexer redis,
        IOptions<SynapseIngestStreamSettings> settings,
        ILogger<RedisStreamPublisherWorker> logger)
    {
        _queue = queue ?? throw new ArgumentNullException(nameof(queue));
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Redis stream ingest publisher started. Stream={Stream}",
            _settings.StreamName);

        try
        {
            await foreach (var message in _queue.ConsumeAllAsync(stoppingToken))
            {
                try
                {
                    await PublishWithRetryAsync(message, stoppingToken);

                    _publishedCount++;
                    if (_publishedCount % 1000 == 0)
                    {
                        _logger.LogInformation(
                            "({Queue}) publisher stats: {Published} published, {Errors} errors",
                            QueueLabel, _publishedCount, _errorCount);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _errorCount++;
                    _logger.LogError(
                        "({Queue}) Message permanently lost after {MaxRetries} retries. Platform={Platform} User={User}. {Error}",
                        QueueLabel, MaxRetries, message.PlatformId, message.Sender.UserName, GetShortError(ex));
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // host is shutting down — ConsumeAllAsync threw on iterator teardown, not an error
        }

        _logger.LogInformation(
            "Redis stream ingest publisher stopped. Published={Published} Errors={Errors}",
            _publishedCount, _errorCount);
    }


    private async Task PublishWithRetryAsync(ChatMessage message, CancellationToken ct)
    {
        for (var attempt = 0; attempt <= MaxRetries; attempt++)
        {
            try
            {
                await PublishAsync(message, ct);
                return;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex) when (attempt < MaxRetries)
            {
                _logger.LogWarning(
                    "({Queue}) Publish attempt {Attempt}/{MaxRetries} failed. Platform={Platform} User={User} RetryIn={Delay}ms. {Error}",
                    QueueLabel, attempt + 1, MaxRetries, message.PlatformId, message.Sender.UserName,
                    (int)RetryDelays[attempt].TotalMilliseconds, GetShortError(ex));

                await Task.Delay(RetryDelays[attempt], ct);
            }
        }
    }

    private async Task PublishAsync(ChatMessage message, CancellationToken ct)
    {
        var db = _redis.GetDatabase();
        var json = JsonSerializer.Serialize(message, JsonOptions);
        var maxLen = (int)Math.Min(_settings.ApproximateMaxLength, int.MaxValue);

        _ = await db.StreamAddAsync(
            _settings.StreamName,
            new[] { new NameValueEntry(_settings.PayloadFieldName, json) },
            messageId: null,
            maxLength: maxLen,
            useApproximateMaxLength: true,
            flags: CommandFlags.None);
    }

    private static string GetShortError(Exception ex)
    {
        var inner = ex;
        while (inner.InnerException is not null)
        {
            inner = inner.InnerException;
        }

        return $"{inner.GetType().Name}: {inner.Message}";
    }

}
