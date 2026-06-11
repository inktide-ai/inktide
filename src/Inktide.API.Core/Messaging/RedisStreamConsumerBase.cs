using Inktide.API.Core.Generators;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Core.Messaging;

/// <summary>
/// Shared base for Redis stream consumer background services.
/// Provides idempotent consumer group creation, a read loop, and an XAUTOCLAIM
/// recovery loop. Subclasses implement only <see cref="ProcessEntryAsync"/>.
/// </summary>
public abstract class RedisStreamConsumerBase : BackgroundService
{
    private readonly IConnectionMultiplexer _redis;
    protected readonly ILogger Logger;

    /// <summary>Redis stream key this consumer reads from.</summary>
    protected abstract string StreamName { get; }
    protected abstract string ConsumerGroup { get; }
    protected abstract string ConsumerName { get; }
    protected abstract string PayloadFieldName { get; }
    protected abstract int ReadCount { get; }
    protected abstract int ReadBlockMilliseconds { get; }
    protected abstract long AutoClaimMinIdleMs { get; }
    protected abstract int AutoClaimBatchSize { get; }
    protected abstract int AutoClaimLoopDelaySeconds { get; }

    protected RedisStreamConsumerBase(IConnectionMultiplexer redis, ILogger logger)
    {
        _redis = redis  ?? throw new ArgumentNullException(nameof(redis));
        Logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var db = _redis.GetDatabase();
            await EnsureConsumerGroupAsync(db, stoppingToken);

            Logger.LogInformation(
                "{Worker} started. Stream={Stream} Group={Group} Consumer={Consumer}",
                GetType().Name, StreamName, ConsumerGroup, ConsumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }

        Logger.LogInformation("{Worker} stopped.", GetType().Name);
    }

    protected abstract Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct);

    // SE.Redis does not support CancellationToken on StreamAcknowledgeAsync.
    // Configure syncTimeout/connectTimeout on ConnectionMultiplexer to bound hang time.
    protected Task AckAsync(IDatabase db, RedisValue entryId)
        => db.StreamAcknowledgeAsync(StreamName, ConsumerGroup, entryId);

    protected static string? ReadField(StreamEntry entry, string field)
    {
        foreach (var v in entry.Values)
            if (v.Name.ToString() == field) return v.Value.ToString();
        return null;
    }

    /// <summary>
    /// Resolves a stable instance ID for the consumer name (hostname, pod name, or short GUID).
    /// Keeps consumer names meaningful in Redis XPENDING output.
    /// </summary>
    protected static string ResolveInstanceId()
        => Environment.GetEnvironmentVariable("DOTNET_HOSTNAME")
           ?? Environment.GetEnvironmentVariable("HOSTNAME")
           ?? Environment.GetEnvironmentVariable("K8S_POD_NAME")
           ?? IdGenerator.New().ToString("N")[..8];

    private async Task EnsureConsumerGroupAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await db.StreamCreateConsumerGroupAsync(
                    StreamName,
                    ConsumerGroup,
                    StreamPosition.Beginning,
                    createStream: true);
                return;
            }
            catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                Logger.LogDebug("Consumer group already exists: {Group}", ConsumerGroup);
                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "{Worker}: failed to create consumer group, retrying in 2s...", GetType().Name);
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }

    private async Task ConsumeLoopAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var entries = await db.StreamReadGroupAsync(
                    StreamName,
                    ConsumerGroup,
                    ConsumerName,
                    position: null,
                    count: ReadCount,
                    noAck: false);

                if (entries.Length == 0)
                {
                    await Task.Delay(ReadBlockMilliseconds, ct);
                    continue;
                }

                foreach (var entry in entries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "{Worker}: stream read error, retrying in 2s...", GetType().Name);
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }

    private async Task AutoClaimLoopAsync(IDatabase db, CancellationToken ct)
    {
        var cursor = (RedisValue)"0-0";

        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(AutoClaimLoopDelaySeconds), ct);
            try
            {
                var result = await db.StreamAutoClaimAsync(
                    StreamName,
                    ConsumerGroup,
                    ConsumerName,
                    minIdleTimeInMs: AutoClaimMinIdleMs,
                    startAtId: cursor,
                    count: AutoClaimBatchSize);

                if (result.IsNull) { cursor = "0-0"; continue; }

                cursor = result.NextStartId.IsNullOrEmpty || result.NextStartId == "0-0"
                    ? "0-0"
                    : result.NextStartId;

                foreach (var entry in result.ClaimedEntries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "{Worker}: XAUTOCLAIM iteration failed", GetType().Name);
                cursor = "0-0";
            }
        }
    }
}
