namespace Chimera.API.TTS.Infrastructure.AzureSpeech;

/// <summary>
/// Configuration for the Azure Cognitive Services Speech HTTP client.
/// Bound from <c>TtsProviders:AzureSpeech</c>.
/// </summary>
public sealed class AzureSpeechTtsClientSettings
{
    public const string SectionName = "TtsProviders:AzureSpeech";

    /// <summary>
    /// Default Azure region used for voice listing and synthesis when no region
    /// is provided at request time. Examples: <c>eastus</c>, <c>westeurope</c>, <c>eastasia</c>.
    /// </summary>
    public string DefaultRegion { get; set; } = "eastus";

    /// <summary>
    /// HTTP client timeout. Defaults to 3 minutes to accommodate long synthesis streams.
    /// </summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(3);
}
