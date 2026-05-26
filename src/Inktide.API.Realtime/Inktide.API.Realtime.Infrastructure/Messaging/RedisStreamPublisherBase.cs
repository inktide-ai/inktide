using Inktide.API.Core.Generators;
using System.Text.Json;
using Inktide.API.Realtime.Infrastructure.Configuration;
using Inktide.API.Realtime.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Realtime.Infrastructure.Messaging;

/// <summary>
/// Base class for Redis Stream → SignalR browser publishers.
/// Handles consumer group lifecycle, polling, XAUTOCLAIM, entry processing, and ACK.
/// Subclasses implement only <see cref="Deserialize"/>, <see cref="IsValid"/>, and
/// <see cref="PushToClientsAsync"/>.
/// </summary>
public abstract class RedisStreamPublisherBase<TPayload, TSettings> : BackgroundService
    where TPayload  : class
    where TSettings : StreamConsumerSettings
{
    protected IHubContext<AudioHub> Hub      { get; }
    protected TSettings             Settings { get; }
    protected ILogger               Logger   { get; }

    private readonly IConnectionMultiplexer _redis;
    private readonly string                 _consumerName;

    protected RedisStreamPublisherBase(
        IConnectionMultiplexer   redis,
        IHubContext<AudioHub>    hub,
        IOptions<TSettings>      settings,
        ILogger                  logger)
    {
        _redis        = redis    ?? throw new ArgumentNullException(nameof(redis));
        Hub           = hub      ?? throw new ArgumentNullException(nameof(hub));
        Settings      = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        Logger        = logger   ?? throw new ArgumentNullException(nameof(logger));
        _consumerName = $"{Settings.ConsumerNamePrefix}-{ResolveInstanceId()}";
    }

    protected abstract TPayload? Deserialize(string json);
    protected abstract bool      IsValid(TPayload payload);
    protected abstract Task      PushToClientsAsync(TPayload payload, CancellationToken ct);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var db = _redis.GetDatabase();
            await EnsureConsumerGroupAsync(db, stoppingToken);

            Logger.LogInformation(
                "{Service} started. Stream={Stream} Group={Group} Consumer={Consumer}",
                GetType().Name, Settings.StreamName, Settings.ConsumerGroup, _consumerName);

            await Task.WhenAll(
                ConsumeLoopAsync(db, stoppingToken),
                AutoClaimLoopAsync(db, stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }

        Logger.LogInformation("{Service} stopped.", GetType().Name);
    }

    private async Task EnsureConsumerGroupAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await db.StreamCreateConsumerGroupAsync(
                    Settings.StreamName,
                    Settings.ConsumerGroup,
                    StreamPosition.Beginning,
                    createStream: true);
                return;
            }
            catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                Logger.LogDebug("Consumer group already exists: {Group}", Settings.ConsumerGroup);
                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Failed to create consumer group, retrying in 2s...");
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
                    Settings.StreamName,
                    Settings.ConsumerGroup,
                    _consumerName,
                    position: null,
                    count: Settings.ReadCount,
                    noAck: false);

                if (entries.Length == 0)
                {
                    await Task.Delay(Settings.ReadBlockMilliseconds, ct);
                    continue;
                }

                foreach (var entry in entries)
                    await ProcessEntryAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Stream read error, retrying in 2s...");
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }

    private async Task AutoClaimLoopAsync(IDatabase db, CancellationToken ct)
    {
        var cursor = (RedisValue)"0-0";

        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(Settings.AutoClaimLoopDelaySeconds), ct);

            try
            {
                var result = await db.StreamAutoClaimAsync(
                    Settings.StreamName,
                    Settings.ConsumerGroup,
                    _consumerName,
                    minIdleTimeInMs: Settings.AutoClaimMinIdleMs,
                    startAtId: cursor,
                    count: Settings.AutoClaimBatchSize);

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
                Logger.LogWarning(ex, "XAUTOCLAIM iteration failed");
                cursor = "0-0";
            }
        }
    }

    protected virtual async Task ProcessEntryAsync(IDatabase db, StreamEntry entry, CancellationToken ct)
    {
        var payloadJson = ReadField(entry, Settings.PayloadFieldName);

        if (payloadJson is null)
        {
            Logger.LogWarning("Entry {Id} has no payload field — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        TPayload? payload;
        try
        {
            payload = Deserialize(payloadJson);
        }
        catch (JsonException ex)
        {
            Logger.LogWarning(ex, "Malformed payload. Id={Id} — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        if (payload is null || !IsValid(payload))
        {
            Logger.LogWarning("Payload {Id} is missing required fields — discarding", entry.Id);
            await AckAsync(db, entry.Id);
            return;
        }

        try
        {
            await PushToClientsAsync(payload, ct);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to push payload to SignalR. EntryId={Id}", entry.Id);
        }
        finally
        {
            await AckAsync(db, entry.Id);
        }
    }

    private Task AckAsync(IDatabase db, RedisValue entryId)
        => db.StreamAcknowledgeAsync(Settings.StreamName, Settings.ConsumerGroup, entryId);

    private static string? ReadField(StreamEntry entry, string field)
    {
        var value = entry[field];
        return value.IsNullOrEmpty ? null : value.ToString();
    }

    internal static string ResolveInstanceId()
        => Environment.GetEnvironmentVariable("DOTNET_HOSTNAME")
           ?? Environment.GetEnvironmentVariable("HOSTNAME")
           ?? Environment.GetEnvironmentVariable("K8S_POD_NAME")
           ?? IdGenerator.New().ToString("N")[..8];
}
