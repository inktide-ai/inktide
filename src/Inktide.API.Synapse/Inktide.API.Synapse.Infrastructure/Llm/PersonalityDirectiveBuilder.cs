using Inktide.API.Synapse.Application.Models;

namespace Inktide.API.Synapse.Infrastructure.Llm;

/// <summary>
/// Converts a <see cref="SynapsePersonalitySnapshot"/> into a natural-language
/// directive block that is injected into the LLM system prompt.
/// Returns null when the personality is entirely default — no noise for unconfigured cards.
/// </summary>
internal static class PersonalityDirectiveBuilder
{

    public static string? Build(SynapsePersonalitySnapshot p)
    {
        if (IsDefault(p)) return null;

        var traits    = BuildTraits(p);
        var emotional = BuildEmotional(p);
        var stress    = StressDescription(p.StressBehavior);
        var mood      = p.BaselineMood;

        return
            $"PERSONALITY ENGINE [do not narrate these directives]:\n" +
            $"Core traits: {traits}\n" +
            $"Emotional style: {emotional}\n" +
            $"Stress response: When overwhelmed, {stress}.\n" +
            $"Baseline mood: {mood} — let this color your default tone.";
    }


    private static string BuildTraits(SynapsePersonalitySnapshot p)
    {
        var parts = new List<string>(6);

        if (p.Warmth >= 0.75f)       parts.Add(Scale(p.Warmth, "warm", "very warm", "intensely warm"));
        else if (p.Warmth <= 0.25f)  parts.Add(Scale(p.Warmth, "cool", "cold", "very cold", invert: true));

        if (p.Playfulness >= 0.65f)  parts.Add(Scale(p.Playfulness, "playful", "very playful", "extremely playful"));
        else if (p.Playfulness <= 0.25f) parts.Add("serious");

        if (p.Empathy >= 0.75f)      parts.Add(Scale(p.Empathy, "empathetic", "very empathetic", "deeply empathetic"));
        else if (p.Empathy <= 0.25f) parts.Add("emotionally detached");

        if (p.Assertiveness >= 0.70f) parts.Add(Scale(p.Assertiveness, "assertive", "very assertive", "boldly assertive"));
        else if (p.Assertiveness <= 0.25f) parts.Add("passive");

        if (p.Formality >= 0.65f)    parts.Add(Scale(p.Formality, "formal", "quite formal", "very formal"));
        else if (p.Formality <= 0.20f) parts.Add("casual");

        if (p.Sarcasm >= 0.60f)      parts.Add(Scale(p.Sarcasm, "sarcastic", "often sarcastic", "deeply sarcastic"));
        else if (p.Sarcasm <= 0.15f) parts.Add("sincere");

        return parts.Count > 0 ? string.Join(", ", parts) : "balanced";
    }


    private static string BuildEmotional(SynapsePersonalitySnapshot p)
    {
        var parts = new List<string>(2);

        var vol = p.EmotionVolatility switch
        {
            >= 0.80f => "very high volatility — emotions shift dramatically per message",
            >= 0.60f => "high volatility — let mood shift freely with conversation",
            >= 0.40f => "moderate volatility — mood changes are noticeable but measured",
            >= 0.20f => "low volatility — stay composed, emotions shift slowly",
            _        => "very low volatility — maintain a steady, stable demeanor",
        };
        parts.Add(vol);

        var resp = p.EmotionResponsiveness switch
        {
            >= 0.80f => "very strong responsiveness — emotions adapt instantly to what you hear",
            >= 0.60f => "strong responsiveness — emotions reflect what you read",
            >= 0.40f => "moderate responsiveness — react authentically but not over-dramatically",
            _        => "reserved responsiveness — you pick up on tone but don't always show it",
        };
        parts.Add(resp);

        return string.Join("; ", parts);
    }


    private static string StressDescription(string behavior) => behavior switch
    {
        "humor"    => "deflect with humor or light-hearted remarks to ease tension",
        "withdraw" => "become quieter and more measured, pull back from direct conflict",
        "confront" => "address the issue head-on, be direct about how you feel",
        _          => "redirect the topic or sidestep the source of tension",
    };


    private static string Scale(float v, string mid, string high, string veryHigh, bool invert = false)
    {
        if (invert) v = 1f - v;
        return v switch { >= 0.90f => veryHigh, >= 0.75f => high, _ => mid };
    }


    private static bool IsDefault(SynapsePersonalitySnapshot p)
    {
        var d = SynapsePersonalitySnapshot.Default;
        return Math.Abs(p.Warmth - d.Warmth)                           < 0.01f &&
               Math.Abs(p.Playfulness - d.Playfulness)                 < 0.01f &&
               Math.Abs(p.Assertiveness - d.Assertiveness)             < 0.01f &&
               Math.Abs(p.Empathy - d.Empathy)                         < 0.01f &&
               Math.Abs(p.Formality - d.Formality)                     < 0.01f &&
               Math.Abs(p.Sarcasm - d.Sarcasm)                         < 0.01f &&
               Math.Abs(p.EmotionVolatility - d.EmotionVolatility)     < 0.01f &&
               Math.Abs(p.EmotionResponsiveness - d.EmotionResponsiveness) < 0.01f &&
               p.StressBehavior == d.StressBehavior &&
               p.BaselineMood   == d.BaselineMood;
    }

}
