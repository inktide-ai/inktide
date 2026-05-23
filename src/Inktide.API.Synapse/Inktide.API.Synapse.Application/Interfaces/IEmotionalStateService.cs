using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// Manages runtime emotional state for AI card characters across conversation turns.
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

    /// <summary>
    /// Blends the newly classified emotion into the character's running state using the provided
    /// personality dynamics (memory, volatility, responsiveness), computes the emotional trajectory,
    /// persists the result, and returns the updated state.
    /// </summary>
    Task<EmotionalState> UpdateAsync(
        Guid characterId,
        EmotionResult newEmotion,
        EmotionDynamics dynamics,
        CancellationToken ct = default);
}
