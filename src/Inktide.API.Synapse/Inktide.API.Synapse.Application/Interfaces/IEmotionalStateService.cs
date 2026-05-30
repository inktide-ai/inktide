using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// Manages runtime emotional and physical state for AI card characters across conversation turns.
/// State is stored externally (Redis) with a TTL so it expires when the character goes dormant.
/// Implementations must be thread-safe; multiple pipeline workers may process concurrent messages.
/// </summary>
public interface IEmotionalStateService
{
    /// <summary>
    /// Returns the current emotional state for the character, or null if no state has been established
    /// (first message, or state expired after inactivity).
    /// </summary>
    Task<EmotionalState?> GetAsync(Guid characterId, CancellationToken ct = default);

    /// <summary>Returns the current physical state, or the default if no state has been established.</summary>
    Task<PhysicalState> GetPhysicalAsync(Guid characterId, CancellationToken ct = default);

    /// <summary>
    /// Blends the newly classified emotion into the character's running emotional state,
    /// updates the physical state (energy decay, attention spike, comfort EMA),
    /// persists both to Redis, and returns the updated pair.
    /// </summary>
    Task<(EmotionalState Emotion, PhysicalState Physical)> UpdateAsync(
        Guid characterId,
        EmotionResult newEmotion,
        EmotionDynamics dynamics,
        CancellationToken ct = default);
}
