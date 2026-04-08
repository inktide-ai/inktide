namespace Chimera.API.TTS.Infrastructure.OpenAi;

/// <summary>
/// Configuration for the official OpenAI TTS provider.
/// Bound from <c>TtsProviders:OpenAi</c>.
/// </summary>
public sealed class OpenAiTtsSettings
{
    public const string SectionName = "TtsProviders:OpenAi";

    /// <summary>
    /// Default model ID when the request does not specify one.
    /// </summary>
    public string DefaultModelId { get; set; } = "tts-1";
}
