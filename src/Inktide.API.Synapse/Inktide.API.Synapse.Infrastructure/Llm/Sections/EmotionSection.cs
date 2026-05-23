using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Llm.Sections;

internal sealed class EmotionSection : IPromptSection
{
    public string? Build(SynapseAggregatedEnvelope envelope)
    {
        var emotion = envelope.Emotion;
        if (emotion?.TrajectoryLabel is null) return null;

        var prev = emotion.PreviousEmotion ?? "neutral";
        var curr = emotion.CurrentEmotion  ?? "neutral";
        return
            $"CURRENT EMOTIONAL TRAJECTORY: {emotion.TrajectoryLabel}\n" +
            $"(recent arc: {prev} → {curr}, intensity {emotion.Intensity:F2})";
    }
}
