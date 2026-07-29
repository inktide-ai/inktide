namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// Reports soul activity so IdleEventDispatcher can track per-character idle thresholds.
/// Registered as a singleton - the same instance that implements BackgroundService.
/// </summary>
public interface IIdleActivityTracker
{
    /// <summary>
    /// Called each time a real message arrives for a character.
    /// Resets the idle clock and updates the current arousal/energy for threshold calculation.
    /// </summary>
    void NotifyActivity(Guid characterId, string channelId, string platformId, float arousal, float energy);
}
