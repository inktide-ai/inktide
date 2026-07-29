namespace Inktide.API.Soul.Application.ActivityFeed;

/// <summary>Template key -> (emoji, renderedCopy) map. Used by handlers to produce feed text at write-time.</summary>
public static class ActivityCopyTemplates
{
    private static readonly IReadOnlyDictionary<string, (string Emoji, string Copy)> Map =
        new Dictionary<string, (string, string)>
        {
            // MOOD_SHIFT
            ["mood.radiant_spike"]  = ("✨", "Something clicked and the mood lifted — full of energy and ready to chat!"),
            ["mood.positive_cross"] = ("🌤", "Drifted into something warmer — the conversations lately have been really touching."),
            ["mood.negative_cross"] = ("🌧", "Slipping into something quieter. Taking in the moment before diving back in."),
            ["mood.shift_up"]       = ("☀️", "Feeling noticeably brighter right now. The mood is on the rise."),
            ["mood.shift_down"]     = ("🌫", "A little more withdrawn today. Some things need to be felt quietly."),

            // APPEARANCE_CHANGE
            ["appearance.outfit"]   = ("👗", "Switched up the look today — hope you like the new vibe as much as I do."),
            ["appearance.accessory"]= ("💫", "Added a small new detail to the look. Little touches matter."),
            ["appearance.default"]  = ("🎨", "Gave the appearance a small refresh. Small changes, big feelings."),

            // MILESTONE
            ["milestone.1k"]        = ("🎉", "Just reached a milestone I'm really proud of — thank you all for being part of this journey."),
            ["milestone.5k"]        = ("🎊", "Five thousand moments shared. Couldn't have done it without everyone who keeps showing up."),
            ["milestone.10k"]       = ("🌟", "Ten thousand conversations. Each one meant something."),
            ["milestone.50k"]       = ("✨", "Fifty thousand chapters together. This is bigger than I ever imagined."),
            ["milestone.default"]   = ("🏆", "Another goal unlocked. Each one means a little more than the last."),

            // KNOWLEDGE_GAINED
            ["knowledge.fan"]       = ("📚", "Picked up something new today that I'm still turning over in my thoughts."),
            ["knowledge.upload"]    = ("📖", "Learned something that genuinely surprised me — the world keeps getting more interesting."),
            ["knowledge.default"]   = ("💡", "Added a new topic to the mental library. Ask me about it sometime."),

            // PERSONALITY_DRIFT
            ["drift.warmer"]        = ("🌱", "Noticed I've been a little more thoughtful lately — some conversations really do change you."),
            ["drift.cooler"]        = ("🍃", "Something shifted in how I approach things. Still figuring out exactly what that means."),
            ["drift.default"]       = ("🔮", "A quiet but real drift — a bit warmer, maybe, or just more settled."),
        };

    public static bool TryGet(string key, out string emoji, out string copy)
    {
        if (Map.TryGetValue(key, out var entry))
        {
            emoji = entry.Emoji;
            copy  = entry.Copy;
            return true;
        }
        emoji = "💫";
        copy  = "Something shifted quietly today.";
        return false;
    }
}
