namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Runtime emotional state for an AI card, maintained across conversation turns.
/// Stored in Redis (TTL 20 min) — NOT persisted to PostgreSQL.
/// Captures momentum and trajectory so the LLM receives a picture of emotional evolution,
/// not just the isolated emotion of the current message.
/// </summary>
public sealed record EmotionalState(
    Guid CharacterId,
    /// <summary>Currently active emotion label ("happy", "sad", etc.). Null = baseline/neutral.</summary>
    string? CurrentEmotion,
    /// <summary>Blended intensity after applying EmotionMemory and EmotionResponsiveness. 0.0–1.0.</summary>
    float Intensity,
    /// <summary>Emotion from the previous turn — used to compute trajectory.</summary>
    string? PreviousEmotion,
    /// <summary>
    /// Rate of emotional change. High momentum means the character is shifting quickly.
    /// Decays toward 0 between messages.
    /// </summary>
    float Momentum,
    /// <summary>
    /// Human-readable description of the emotional arc, e.g. "warming up", "becoming defensive".
    /// Injected into the LLM system prompt when non-null.
    /// </summary>
    string? TrajectoryLabel,
    DateTimeOffset LastUpdated);
