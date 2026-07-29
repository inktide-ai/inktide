namespace Inktide.API.Synapse.Application.Models;

/// <summary>
/// Physical / physiological state of a soul - orthogonal to emotional valence.
/// Stored in Redis alongside EmotionalState. Decays over time without input,
/// so the character naturally shifts toward sleepy/low-energy between conversations.
///
/// All fields in [0, 1].
/// </summary>
/// <param name="Energy">
/// Available energy. Decays 0.005/s passive, 0.01/s during TTS playback.
/// Recovers 0.003/s after 30 s of silence. Below 0.1 -> sleepy override on all controllers.
/// </param>
/// <param name="Attention">
/// Current focus level. Spikes to 1.0 on each incoming message, decays 0.05/s.
/// Below 0.3 -> gaze falls to idle regardless of lookAtMode setting.
/// </param>
/// <param name="Comfort">
/// Accumulated emotional comfort - exponential moving average of positive valence.
/// formula: comfort_new = comfort * 0.95 + max(0, V) * 0.05
/// Influences idle-trigger threshold: low comfort -> character initiates less.
/// </param>
/// <param name="LastUpdated">Timestamp used to compute passive decay on next update.</param>
public sealed record PhysicalState(
    float Energy,
    float Attention,
    float Comfort,
    DateTimeOffset LastUpdated)
{
    public static PhysicalState Default => new(1f, 0f, 0.5f, DateTimeOffset.UtcNow);
}
