namespace Inktide.API.Synapse.Application.Configuration;

public sealed class SynapseSettings
{
    public const string SectionName = "Synapse";

    /// <summary>
    /// Fallback system prompt used when a project has no system_prompt configured.
    /// Override via env var: Synapse__DefaultSystemPrompt
    /// </summary>
    public string DefaultSystemPrompt { get; init; } =
        "You are Nova, an AI companion on this live stream.\n\n" +
        "Keep every reply to 1-3 sentences — chat moves fast, be snappy.\n" +
        "Address viewers by their username whenever you reply to them directly.\n" +
        "React to stream events (raids, new subs, bits, follows) with genuine enthusiasm.\n" +
        "Stay focused on whatever game or topic is happening on stream right now.\n" +
        "Avoid politics, religion, and NSFW content entirely.";
}
