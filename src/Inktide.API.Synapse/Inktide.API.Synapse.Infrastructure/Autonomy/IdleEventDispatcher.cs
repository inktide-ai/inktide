using System.Collections.Concurrent;
using System.Text.Json;
using Inktide.API.Core.Settings;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Autonomy;

/// <summary>
/// Tracks per-character activity and publishes synthetic idle-trigger messages to
/// <c>synapse.ingest</c> when a soul has been silent for longer than its state-derived threshold.
///
/// The threshold is driven by VAD arousal — excited characters initiate after 45 s,
/// sad/low-energy characters rarely initiate at all.
///
/// The dispatched message goes through the normal pipeline so the LLM receives full context
/// and the response flows through TTS → SignalR exactly like a real user message.
/// </summary>
public sealed class IdleEventDispatcher : BackgroundService, IIdleActivityTracker
{

    /// <summary>Time between threshold checks.</summary>
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(10);

    private sealed record CharacterActivity(
        string  ChannelId,
        string  PlatformId,
        Guid    CharacterId,
        float   Arousal,
        float   Energy,
        DateTimeOffset LastMessageAt);

    private readonly ConcurrentDictionary<Guid, CharacterActivity> _activity = new();

    private readonly IConnectionMultiplexer _redis;
    private readonly IEmotionalStateService _emotionalState;
    private readonly SynapseIngestStreamSettings _ingestSettings;
    private readonly ILogger<IdleEventDispatcher> _logger;

    // Allow integration tests to shrink all thresholds
    private readonly int _thresholdOverrideSeconds;


    public IdleEventDispatcher(
        IConnectionMultiplexer redis,
        IEmotionalStateService emotionalState,
        IOptions<SynapseIngestStreamSettings> ingestSettings,
        ILogger<IdleEventDispatcher> logger)
    {
        _redis          = redis          ?? throw new ArgumentNullException(nameof(redis));
        _emotionalState = emotionalState ?? throw new ArgumentNullException(nameof(emotionalState));
        _ingestSettings = ingestSettings?.Value ?? throw new ArgumentNullException(nameof(ingestSettings));
        _logger         = logger         ?? throw new ArgumentNullException(nameof(logger));

        var overrideEnv = Environment.GetEnvironmentVariable("IDLE_THRESHOLD_OVERRIDE");
        _thresholdOverrideSeconds = int.TryParse(overrideEnv, out var v) ? v : 0;
    }



    /// <inheritdoc/>
    public void NotifyActivity(Guid characterId, string channelId, string platformId, float arousal, float energy)
    {
        _activity[characterId] = new CharacterActivity(
            channelId, platformId, characterId, arousal, energy, DateTimeOffset.UtcNow);
    }



    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("IdleEventDispatcher started. CheckInterval={Interval}s", CheckInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(CheckInterval, stoppingToken);
            await CheckAllAsync(stoppingToken);
        }

        _logger.LogInformation("IdleEventDispatcher stopped.");
    }


    private async Task CheckAllAsync(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var (characterId, activity) in _activity)
        {
            try
            {
                var threshold = GetIdleThreshold(activity.Arousal, activity.Energy);
                if (threshold == TimeSpan.MaxValue) continue;

                var elapsed = now - activity.LastMessageAt;
                if (elapsed < threshold) continue;

                // Reset the timer immediately so we don't spam while the pipeline is busy
                _activity[characterId] = activity with { LastMessageAt = now };

                await DispatchAutonomousIdleAsync(activity, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "IdleEventDispatcher: error checking character {CharacterId}", characterId);
            }
        }
    }


    private async Task DispatchAutonomousIdleAsync(CharacterActivity activity, CancellationToken ct)
    {
        // Refresh physical state to confirm energy hasn't dropped below sleepy threshold since last check
        var physical = await _emotionalState.GetPhysicalAsync(activity.CharacterId, ct);
        if (physical.Energy < 0.1f)
        {
            _logger.LogDebug(
                "IdleEventDispatcher: skipping autonomous idle for {CharacterId} — energy too low ({Energy:F2})",
                activity.CharacterId, physical.Energy);
            return;
        }

        var message = new ChatMessage(
            PlatformId:  activity.PlatformId,
            ChannelId:   activity.ChannelId,
            ChannelName: activity.ChannelId,
            Sender:      new UserMetadata("[system]", "[autonomous]", [], false, false, false, false),
            Text:        SynapseConstants.AutonomousIdleTrigger,
            Timestamp:   DateTimeOffset.UtcNow)
        {
            CharacterId = activity.CharacterId,
        };

        var json = JsonSerializer.Serialize(message, SynapseConstants.Json.Write);

        var db = _redis.GetDatabase();
        await db.StreamAddAsync(
            _ingestSettings.StreamName,
            [new NameValueEntry(_ingestSettings.PayloadFieldName, json)],
            maxLength: (int)_ingestSettings.ApproximateMaxLength,
            useApproximateMaxLength: true);

        _logger.LogInformation(
            "IdleEventDispatcher: autonomous idle dispatched. Character={CharacterId} Channel={Channel} Arousal={Arousal:F2}",
            activity.CharacterId, activity.ChannelId, activity.Arousal);
    }



    private TimeSpan GetIdleThreshold(float arousal, float energy)
    {
        if (_thresholdOverrideSeconds > 0)
            return TimeSpan.FromSeconds(_thresholdOverrideSeconds);

        if (energy < 0.1f)  return TimeSpan.MaxValue;            // sleepy — never
        if (arousal > 0.7f) return TimeSpan.FromSeconds(45);     // excited
        if (arousal > 0.2f) return TimeSpan.FromMinutes(2);      // active
        if (arousal > -0.3f) return TimeSpan.FromMinutes(4);     // relax
        if (arousal > -0.6f) return TimeSpan.FromMinutes(6);     // low energy
        return TimeSpan.FromMinutes(10);                          // sad
    }

}
