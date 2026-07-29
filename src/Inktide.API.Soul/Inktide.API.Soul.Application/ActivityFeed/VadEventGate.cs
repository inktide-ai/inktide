namespace Inktide.API.Soul.Application.ActivityFeed;

public sealed record VadGateResult(bool ShouldEmit, string? HumanLabel, string? TemplateKey);

/// <summary>
/// Pure static gate - no I/O. Caller is responsible for cooldown DB checks.
/// VAD values are normalized 0..1 with 0.5 = neutral.
/// Boundary high = 0.6, boundary low = 0.4 (1 - 0.6).
/// </summary>
public static class VadEventGate
{
    private const float ValenceDeltaThreshold = 0.35f;
    private const float BoundaryHigh          = 0.6f;
    private const float BoundaryLow           = 0.4f;
    private const float ArousalBoundaryHigh   = 0.7f;
    private static readonly TimeSpan Cooldown = TimeSpan.FromHours(4);

    public static VadGateResult Evaluate(
        float? prevValence,
        float  currentValence,
        float  currentArousal,
        DateTime? lastEventAt,
        DateTime  now)
    {
        if (lastEventAt.HasValue && (now - lastEventAt.Value) < Cooldown)
            return new VadGateResult(false, null, null);

        float prev  = prevValence ?? 0.5f;
        float delta = Math.Abs(currentValence - prev);

        if (delta < ValenceDeltaThreshold)
            return new VadGateResult(false, null, null);

        var (label, key) = DetermineLabel(prev, currentValence, currentArousal);
        return new VadGateResult(true, label, key);
    }

    private static (string label, string key) DetermineLabel(float prev, float current, float arousal)
    {
        if (current >= BoundaryHigh && arousal >= ArousalBoundaryHigh)
            return ("feeling radiant and full of energy", "mood.radiant_spike");

        if (current >= BoundaryHigh && prev < BoundaryHigh)
            return ("in a much warmer place emotionally", "mood.positive_cross");

        if (current <= BoundaryLow && prev > BoundaryLow)
            return ("slipping into a quieter, heavier mood", "mood.negative_cross");

        return current > prev
            ? ("feeling noticeably brighter", "mood.shift_up")
            : ("feeling a little more withdrawn", "mood.shift_down");
    }
}
