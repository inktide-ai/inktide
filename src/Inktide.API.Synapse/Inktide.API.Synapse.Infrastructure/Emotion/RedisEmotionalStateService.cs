using System.Text.Json;
using Inktide.API.Synapse.Application.Interfaces;
using Inktide.API.Synapse.Application.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inktide.API.Synapse.Infrastructure.Emotion;

/// <summary>
/// Maintains per-character emotional state in Redis with a 20-minute TTL.
/// State expires automatically when the character goes dormant, resetting emotion to baseline
/// on the next conversation without any explicit cleanup.
/// </summary>
public sealed class RedisEmotionalStateService : IEmotionalStateService
{

    private static readonly TimeSpan StateTtl = TimeSpan.FromMinutes(20);

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

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
            var raw = await db.StringGetAsync(StateKey(characterId));
            if (raw.IsNullOrEmpty) return null;

            return JsonSerializer.Deserialize<EmotionalState>((string)raw!, JsonOpts);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[EmotionalState] Failed to read state for character {CharacterId}", characterId);
            return null;
        }
    }


    public async Task<EmotionalState> UpdateAsync(
        Guid characterId,
        EmotionResult newEmotion,
        EmotionDynamics dynamics,
        CancellationToken ct = default)
    {
        var current = await GetAsync(characterId, ct);
        var updated = Blend(characterId, current, newEmotion, dynamics);

        try
        {
            var db  = _redis.GetDatabase();
            var raw = JsonSerializer.Serialize(updated, JsonOpts);
            await db.StringSetAsync(StateKey(characterId), raw, StateTtl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[EmotionalState] Failed to persist state for character {CharacterId}", characterId);
        }

        _logger.LogDebug(
            "[EmotionalState] Updated. Character={CharacterId} {Prev}→{Curr} intensity={Intensity:F2} momentum={Momentum:F2} trajectory={Trajectory}",
            characterId,
            current?.CurrentEmotion ?? "null",
            updated.CurrentEmotion  ?? "null",
            updated.Intensity,
            updated.Momentum,
            updated.TrajectoryLabel ?? "-");

        return updated;
    }


    // ── Blending ──────────────────────────────────────────────────────────────

    private static EmotionalState Blend(
        Guid characterId,
        EmotionalState? current,
        EmotionResult incoming,
        EmotionDynamics dynamics)
    {
        var newEmotion    = incoming.Emotion;
        var newRawIntensity = incoming.Intensity;

        var previousEmotion  = current?.CurrentEmotion;
        var previousIntensity = current?.Intensity ?? 0f;

        var responsiveness = Math.Clamp(dynamics.Responsiveness, 0f, 1f);
        var memory         = Math.Clamp(dynamics.Memory,         0f, 1f);

        float blendedIntensity;
        string? blendedEmotion;

        if (string.IsNullOrEmpty(newEmotion))
        {
            // No new emotion — decay toward neutral based on memory
            blendedEmotion    = memory > 0.5f ? previousEmotion : null;
            blendedIntensity  = previousIntensity * memory * 0.8f;
        }
        else
        {
            // Absorb the new emotion, weighted by responsiveness
            blendedIntensity = newRawIntensity * responsiveness
                             + previousIntensity * memory * (1f - responsiveness);
            blendedIntensity = Math.Clamp(blendedIntensity, 0f, 1f);

            // If new emotion is strong enough to override, switch; otherwise blend labels
            blendedEmotion = newRawIntensity * responsiveness > previousIntensity * memory * 0.6f
                ? newEmotion
                : (previousEmotion ?? newEmotion);
        }

        var momentum = Math.Abs(blendedIntensity - previousIntensity);
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


    private static string? ComputeTrajectory(string? from, string? to, float momentum)
    {
        if (momentum < 0.08f)
        {
            return to is null ? null : $"steady {to}";
        }

        if (momentum > 0.4f) return "shifting rapidly";

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


    private static string StateKey(Guid characterId) => $"emotion:state:{characterId:N}";

}
