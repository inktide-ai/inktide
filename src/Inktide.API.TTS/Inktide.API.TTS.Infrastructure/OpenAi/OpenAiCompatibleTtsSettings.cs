namespace Inktide.API.TTS.Infrastructure.OpenAi;

/// <summary>
/// Configuration for an OpenAI-compatible TTS provider (any server that speaks the OpenAI Audio API).
/// Bound from <c>TtsProviders:OpenAiCompatible</c>.
/// </summary>
public sealed class OpenAiCompatibleTtsSettings
{
    public const string SectionName = "TtsProviders:OpenAiCompatible";

    /// <summary>
    /// Base URL of the OpenAI-compatible API, e.g. <c>http://localhost:8000/v1</c>.
    /// Required — no default.
    /// </summary>
    public Uri? Endpoint { get; set; }

    /// <summary>
    /// Default model ID when the request does not specify one.
    /// </summary>
    public string DefaultModelId { get; set; } = "tts-1";
}
