using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Application.Interfaces;

/// <summary>
/// DIP port: classifies the emotional reaction an AI character should show
/// in response to an inbound chat message.
///
/// OCP: swap classifier backend (Ollama → external API, etc.) by providing
/// a new implementation — nothing else changes.
/// </summary>
public interface IEmotionClassificationService
{
    /// <summary>
    /// Classifies the emotional reaction for <paramref name="message"/>.
    /// </summary>
    /// <param name="message">Raw chat message text.</param>
    /// <param name="personality">AI card personality hint (biases the classification).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>
    /// An <see cref="EmotionResult"/> — never throws; returns <c>Emotion = null</c> on failure.
    /// </returns>
    Task<EmotionResult> ClassifyAsync(string message, string? personality, CancellationToken ct, float intensityScale = 1.0f);
}
