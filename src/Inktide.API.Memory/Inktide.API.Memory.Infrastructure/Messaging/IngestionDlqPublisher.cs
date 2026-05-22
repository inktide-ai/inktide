using System.Text.Json;
using Inktide.API.Memory.Application.Interfaces;
using Inktide.API.Memory.Domain.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Memory.Infrastructure.Messaging;

public sealed class IngestionDlqPublisher : IIngestionDlqPublisher
{
    private const string DlqStreamName = "memory.ingestion.dlq";
    private const int MaxStreamLength = 10_000;

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<IngestionDlqPublisher> _logger;

    public IngestionDlqPublisher(IConnectionMultiplexer redis, ILogger<IngestionDlqPublisher> logger)
    {
        _redis  = redis  ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task PublishAsync(MemoryIngestionJob job, string errorMessage, CancellationToken ct = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            await db.StreamAddAsync(
                DlqStreamName,
                new NameValueEntry[]
                {
                    new("schemaVersion", "1"),
                    new("jobType",       "memory-ingestion"),
                    new("cardId",        job.CharacterId.ToString()),
                    new("channelId",     job.ChannelId),
                    new("failedAtUtc",   DateTimeOffset.UtcNow.ToString("O")),
                    new("error",         errorMessage),
                    new("payload",       JsonSerializer.Serialize(job)),
                },
                maxLength: MaxStreamLength,
                useApproximateMaxLength: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "IngestionDlqPublisher: failed to write to DLQ for card {CardId}",
                job.CharacterId);
        }
    }
}
