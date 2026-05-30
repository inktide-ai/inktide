using System.Text.Json;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Emotion;

/// <summary>
/// Maintains per-character emotional and physical state in Redis with a 20-minute TTL.
/// State expires automatically when the character goes dormant, resetting to baseline
/// on the next conversation without any explicit cleanup.
/// </summary>
internal sealed class RedisEmotionalStateService : IEmotionalStateService
{

    private static readonly TimeSpan StateTtl = TimeSpan.FromMinutes(20);

    private const float DecayFactor         = 0.8f;
    private const float MemoryBiasThreshold = 0.5f;
    private const float OverrideThreshold   = 0.6f;
    private const float SteadyMomentumMax   = 0.08f;
    private const float RapidShiftMomentum  = 0.4f;

    // Physical decay constants (per second)
    private const float EnergyPassiveDecay = 0.005f;
    private const float ComfortEmaAlpha    = 0.05f;


    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisEmotionalStateService> _logger;


    public RedisEmotionalStateService(
        IConnectionMultiplexer redis,
        ILogger<RedisEmotionalStateService> logger)
    {
        _redis  = redis  ?? throw new ArgumentNullException(nameof(redis));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }


    public async Task<EmotionalState?> GetAsync(Guid characterId, CancellationToken ct = default)
    {
        try
        {
            var db  = _redis.GetDatabase();
            var raw = await db.StringGetAsync(EmotionKey(characterId));
            if (raw.IsNullOrEmpty) return null;

            return JsonSerializer.Deserialize<EmotionalState>((string)raw!, SynapseConstants.Json.Write);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[EmotionalState] Failed to read state for character {CharacterId}", characterId);
            return null;
        }
    }

    public async Task<PhysicalState> GetPhysicalAsync(Guid characterId, CancellationToken ct = default)
    {
        try
        {
            var db  = _redis.GetDatabase();
            var raw = await db.StringGetAsync(PhysicalKey(characterId));
            if (raw.IsNullOrEmpty) return PhysicalState.Default;

            return JsonSerializer.Deserialize<PhysicalState>((string)raw!, SynapseConstants.Json.Write)
                   ?? PhysicalState.Default;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[PhysicalState] Failed to read state for character {CharacterId}", characterId);
            return PhysicalState.Default;
        }
    }


    public async Task<(EmotionalState Emotion, PhysicalState Physical)> UpdateAsync(
        Guid characterId,
        EmotionResult newEmotion,
        EmotionDynamics dynamics,
        CancellationToken ct = default)
    {
        var currentEmotion  = await GetAsync(characterId, ct);
        var currentPhysical = await GetPhysicalAsync(characterId, ct);

        var updatedEmotion  = BlendEmotion(characterId, currentEmotion, newEmotion, dynamics);
        var vad             = EmotionVadTable.Map(updatedEmotion.CurrentEmotion);
        var updatedPhysical = UpdatePhysical(currentPhysical, vad);

        try
        {
            var db          = _redis.GetDatabase();
            var rawEmotion  = JsonSerializer.Serialize(updatedEmotion,  SynapseConstants.Json.Write);
            var rawPhysical = JsonSerializer.Serialize(updatedPhysical, SynapseConstants.Json.Write);

            await Task.WhenAll(
                db.StringSetAsync(EmotionKey(characterId),  rawEmotion,  StateTtl),
                db.StringSetAsync(PhysicalKey(characterId), rawPhysical, StateTtl));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[SoulState] Failed to persist state for character {CharacterId}", characterId);
        }

        _logger.LogDebug(
            "[SoulState] Updated. Character={CharacterId} emotion={Curr} intensity={Intensity:F2} " +
            "vad=({V:F2},{A:F2},{D:F2}) energy={Energy:F2} attention={Attention:F2} comfort={Comfort:F2}",
            characterId,
            updatedEmotion.CurrentEmotion ?? "null",
            updatedEmotion.Intensity,
            vad.V, vad.A, vad.D,
            updatedPhysical.Energy,
            updatedPhysical.Attention,
            updatedPhysical.Comfort);

        return (updatedEmotion, updatedPhysical);
    }


    // ── Emotion blending ──────────────────────────────────────────────────────

    private static EmotionalState BlendEmotion(
        Guid characterId,
        EmotionalState? current,
        EmotionResult incoming,
        EmotionDynamics dynamics)
    {
        var newEmotion      = incoming.Emotion;
        var newRawIntensity = incoming.Intensity;

        var previousEmotion   = current?.CurrentEmotion;
        var previousIntensity = current?.Intensity ?? 0f;

        var responsiveness = Math.Clamp(dynamics.Responsiveness, 0f, 1f);
        var memory         = Math.Clamp(dynamics.Memory,         0f, 1f);

        float blendedIntensity;
        string? blendedEmotion;

        if (string.IsNullOrEmpty(newEmotion))
        {
            blendedEmotion   = memory > MemoryBiasThreshold ? previousEmotion : null;
            blendedIntensity = previousIntensity * memory * DecayFactor;
        }
        else
        {
            blendedIntensity = newRawIntensity * responsiveness
                             + previousIntensity * memory * (1f - responsiveness);
            blendedIntensity = Math.Clamp(blendedIntensity, 0f, 1f);

            blendedEmotion = newRawIntensity * responsiveness > previousIntensity * memory * OverrideThreshold
                ? newEmotion
                : (previousEmotion ?? newEmotion);
        }

        var momentum   = Math.Abs(blendedIntensity - previousIntensity);
        var trajectory = ComputeTrajectory(previousEmotion, blendedEmotion, momentum);

        return new EmotionalState(
            CharacterId:    characterId,
            CurrentEmotion: string.IsNullOrEmpty(blendedEmotion) ? null : blendedEmotion,
            Intensity:      blendedIntensity,
            PreviousEmotion: previousEmotion,
            Momentum:       momentum,
            TrajectoryLabel: trajectory,
            LastUpdated:    DateTimeOffset.UtcNow);
    }


    // ── Physical state update ─────────────────────────────────────────────────

    private static PhysicalState UpdatePhysical(PhysicalState prev, VadVector vad)
    {
        var elapsed = (float)(DateTimeOffset.UtcNow - prev.LastUpdated).TotalSeconds;
        elapsed = Math.Clamp(elapsed, 0f, 120f); // cap to prevent huge jumps on very first call

        var energy    = Math.Clamp(prev.Energy - EnergyPassiveDecay * elapsed, 0f, 1f);
        var attention = 1.0f; // incoming message always spikes attention
        var comfort   = Math.Clamp(
            prev.Comfort * (1f - ComfortEmaAlpha) + Math.Max(0f, vad.V) * ComfortEmaAlpha,
            0f, 1f);

        return new PhysicalState(energy, attention, comfort, DateTimeOffset.UtcNow);
    }


    // ── Trajectory ────────────────────────────────────────────────────────────

    private static string? ComputeTrajectory(string? from, string? to, float momentum)
    {
        if (momentum < SteadyMomentumMax)
            return to is null ? null : $"steady {to}";

        if (momentum > RapidShiftMomentum) return "shifting rapidly";

        var fv = GetValence(from);
        var tv = GetValence(to);

        return (fv, tv) switch
        {
            (EmotionValence.Neutral,  EmotionValence.Positive) => "warming up",
            (EmotionValence.Neutral,  EmotionValence.Negative) => "becoming tense",
            (EmotionValence.Positive, EmotionValence.Negative) => "becoming defensive",
            (EmotionValence.Negative, EmotionValence.Positive) => "gradually recovering",
            (EmotionValence.Negative, EmotionValence.Negative) => "remaining tense",
            _ => null,
        };
    }

    private enum EmotionValence { Neutral, Positive, Negative }

    private static EmotionValence GetValence(string? emotion) => emotion switch
    {
        "happy" or "surprised" or "blush" => EmotionValence.Positive,
        "sad" or "angry" or "sleepy"      => EmotionValence.Negative,
        _                                 => EmotionValence.Neutral,
    };


    private static string EmotionKey(Guid characterId)  => $"emotion:state:{characterId:N}";
    private static string PhysicalKey(Guid characterId) => $"physical:state:{characterId:N}";

}
