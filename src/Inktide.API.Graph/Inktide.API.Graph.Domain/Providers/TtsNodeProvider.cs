using Inktide.API.Graph.Domain.Contracts;
using Inktide.API.Graph.Domain.Models;

namespace Inktide.API.Graph.Domain.Providers;

/// <summary>
/// Converts text from the LLM node into synthesised audio.
/// Provider selection follows the same registry pattern as the TTS bounded context.
/// </summary>
public sealed class TtsNodeProvider : INodeProvider
{
    public string Type => "tts";
    public string ProviderId => "core";

    public NodeDefinition GetDefinition() => new(
        Type: Type,
        ProviderId: ProviderId,
        Label: "TTS",
        Description: "Synthesises speech audio from the LLM text response.",
        Inputs:
        [
            new Port("text", "text", "Text to synthesise"),
        ],
        Outputs:
        [
            new Port("audio", "audio", "PCM audio stream"),
        ],
        ConfigSchema: new Dictionary<string, ConfigFieldSchema>
        {
            ["provider_id"] = new("select",
                Default: "kokoro",
                Description: "Speech synthesis backend",
                Options: ["kokoro", "elevenlabs"]),

            ["voice_id"] = new("string",
                Default: "",
                Description: "Provider-specific voice identifier"),

            ["speed"] = new("number",
                Default: 1.0,
                Description: "Playback speed multiplier (0.5 – 2.0)"),

            ["stability"] = new("number",
                Default: 0.75,
                Description: "Voice stability (ElevenLabs); ignored by Kokoro"),
        });
}
