using Inktide.API.Core.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Messaging;

internal sealed class RedisConsumerGroupInitializer(
    RedisStreamConnectionMonitor monitor,
    IOptions<SynapseIngestStreamSettings> settingsOptions,
    ILogger<RedisConsumerGroupInitializer> logger)
{
    internal async Task EnsureAsync(IDatabase db, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await db.StreamCreateConsumerGroupAsync(
                    settingsOptions.Value.StreamName,
                    settingsOptions.Value.ConsumerGroup,
                    StreamPosition.Beginning,
                    createStream: true,
                    flags: CommandFlags.None);
                return;
            }
            catch (RedisException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogDebug("Consumer group already exists: {Group}", settingsOptions.Value.ConsumerGroup);
                return;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (RedisException ex) when (RedisStreamConnectionMonitor.IsConnectionIssue(ex))
            {
                logger.LogWarning(
                    "Synapse ingest: could not create consumer group yet ({Reason}). Waiting for Redis...",
                    RedisStreamConnectionMonitor.GetErrorSummary(ex));
                await monitor.WaitForRedisAvailableAsync(ct);
            }
        }
    }
}
