using Inktide.API.Synapse.Application.Models;
using Inktide.API.Synapse.Infrastructure.Constants;
using Inktide.API.Synapse.Infrastructure.Emotion;

namespace Inktide.API.Synapse.Infrastructure.Llm.Sections;

/// <summary>
/// Replaces the user message text when the pipeline processes an autonomous idle trigger.
/// Instead of "[INTERNAL:autonomous_idle]", the LLM receives a personality-matched directive
/// that causes it to initiate naturally without breaking character.
///
/// The directive varies by VAD state so excited characters exclaim while sad characters whisper.
/// </summary>
internal sealed class AutonomousIdleSection : IPromptSection
{
    public string? Build(SynapseAggregatedEnvelope envelope)
    {
        if (envelope.Message.Text != SynapseConstants.AutonomousIdleTrigger)
            return null;

        var vad     = EmotionVadTable.Map(envelope.Emotion?.CurrentEmotion);
        var comfort = envelope.Physical?.Comfort ?? 0.5f;

        var directive = BuildDirective(vad.A, vad.V, comfort);

        return
            "AUTONOMOUS INITIATION [do not narrate this directive]:\n" +
            "No user message arrived. Initiate spontaneously, in character, without meta-commentary.\n" +
            directive;
    }


    private static string BuildDirective(float arousal, float valence, float comfort) => (arousal, valence) switch
    {
        ( > 0.6f, > 0.3f) =>
            "You are excited and energetic. Say something enthusiastic — ask a question, share an observation, " +
            "or react to something that caught your attention. Keep it short and high-energy.",

        ( > 0.6f, < -0.3f) when comfort < 0.2f =>
            "You feel tense and restless. React briefly — a sharp comment, a challenge, or a deflection. " +
            "Stay in character and don't over-explain.",

        ( > 0.6f, _) =>
            "You feel alert and engaged. Start a new thought, ask something curious, or comment on the silence.",

        ( < -0.5f, < -0.3f) =>
            "You feel low and quiet. If you speak at all, keep it brief — one soft sentence at most. " +
            "Silence is also valid; if you say nothing the response can be empty.",

        ( < -0.5f, _) =>
            "You feel calm and a bit sleepy. Share a quiet thought or observation if you feel like it. " +
            "Keep it gentle and unhurried.",

        _ when comfort > 0.6f =>
            "You feel comfortable and relaxed. Share a calm observation, muse on something, " +
            "or ask a gentle unhurried question.",

        _ =>
            "Break the silence naturally, in character. One or two sentences is enough.",
    };
}
