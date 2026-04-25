namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Result of emotion classification for one inbound message.
/// Placed in <see cref="MessageProcessingContext"/> by <c>EmotionScatterShard</c>.
/// </summary>
/// <param name="Emotion">
/// One of: angry, sad, surprised, relax, happy, blush, sleepy, thinking — or <c>null</c> when
/// no strong emotional reaction is warranted.
/// </param>
/// <param name="Intensity">Confidence score, 0.0–1.0.</param>
public sealed record EmotionResult(string? Emotion, float Intensity);
