using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Chimera.API.TTS.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TtsModel = Chimera.API.TTS.Domain.Models.TtsModel;
using TtsModelCollection = Chimera.API.TTS.Domain.Models.TtsModelCollection;
using TtsVoiceCollection = Chimera.API.TTS.Domain.Models.TtsVoiceCollection;

namespace Chimera.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// HTTP client for Kokoro TTS OpenAPI-compatible endpoints.
/// </summary>
public sealed partial class KokoroTtsClient
{
    #region Constants

    private const string KokoroTtsV1Endpoint = "http://localhost:8880/v1";
    
    public const string HttpClientName = "KokoroTTS";

    #endregion

    #region Fields

    private readonly IHttpClientFactory _httpClientFactory;

    private readonly ILogger<KokoroTtsClient>? _logger;

    private readonly Uri _endpoint;

    #endregion

    #region Constructor

    public KokoroTtsClient(
        IHttpClientFactory httpChannelFactory,
        IOptions<KokoroTtsClientSettings> options,
        ILogger<KokoroTtsClient>? logger)
    {
        _httpClientFactory = httpChannelFactory ?? throw new ArgumentNullException(nameof(httpChannelFactory));
        _logger = logger;
        _endpoint = GetEndpoint(options.Value);
    }

    #endregion

    #region Properties

    public Uri Endpoint => _endpoint;

    #endregion

    #region Internal Methods

    internal static Uri GetEndpoint(KokoroTtsClientSettings? options = null)
    {
        return options?.Endpoint ?? new(KokoroTtsV1Endpoint);
    }

    #endregion

    #region Private Methods

    private HttpClient CreateClient()
    {
        return _httpClientFactory.CreateClient(HttpClientName);
    }
    
    #endregion
    
}
