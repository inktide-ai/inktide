namespace Chimera.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Configuration for the Cartesia TTS HTTP client.
/// Bound from <c>TtsProviders:Cartesia</c>.
/// </summary>
public sealed class CartesiaTtsClientSettings
{
    public const string SectionName = "TtsProviders:Cartesia";

    /// <summary>
    /// Cartesia API base URL.
    /// </summary>
    public Uri Endpoint { get; set; } = new Uri("https://api.cartesia.ai");

    /// <summary>
    /// Default TTS model. Cartesia recommends using the base model name to always
    /// resolve to the latest snapshot.
    /// </summary>
    public string DefaultModel { get; set; } = "sonic-2";

    /// <summary>
    /// Cartesia API version header value.
    /// </summary>
    public string ApiVersion { get; set; } = "2024-11-13";

    /// <summary>
    /// HTTP client timeout. Defaults to 3 minutes.
    /// </summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(3);
}
