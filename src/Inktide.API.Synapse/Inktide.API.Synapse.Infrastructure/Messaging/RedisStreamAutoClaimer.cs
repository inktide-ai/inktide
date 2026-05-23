using Inktide.API.Core.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Messaging;

internal sealed class RedisStreamAutoClaimer(
    RedisStreamConnectionMonitor monitor,
    IChatMessageProcessor processor,
    IOptions<SynapseIngestStreamSettings> settingsOptions,
    ILogger<RedisStreamAutoClaimer> logger)
{
    private SynapseIngestStreamSettings Settings => settingsOptions.Value;

    internal async Task RunAsync(IDatabase db, string consumerName, CancellationToken ct)
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
                    consumerName,
                    minIdleTimeInMs: Settings.AutoClaimMinIdleMs,
                    startAtId: cursor,
                    count: Settings.AutoClaimBatchSize,
                    flags: CommandFlags.None);

                if (result.IsNull)
                {
                    cursor = "0-0";
                    continue;
                }

                cursor = result.NextStartId.IsNullOrEmpty || result.NextStartId == "0-0"
                    ? "0-0"
                    : result.NextStartId;

                foreach (var entry in result.ClaimedEntries)
                    await processor.ProcessAsync(db, entry, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (RedisException ex) when (RedisStreamConnectionMonitor.IsConnectionIssue(ex))
            {
                logger.LogWarning(
                    "Synapse ingest: XAUTOCLAIM interrupted ({Reason}). Reconnecting...",
                    RedisStreamConnectionMonitor.GetErrorSummary(ex));
                await monitor.WaitForRedisAvailableAsync(ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "XAUTOCLAIM iteration failed");
            }
        }
    }
}
