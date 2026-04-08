using System.Text.Json;
using Chimera.API.TTS.Domain.Models;
using Microsoft.Extensions.Options;

namespace Chimera.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Raw HTTP client for the Cartesia TTS REST API.
/// </summary>
public sealed class CartesiaTtsClient
{
    #region Constants

    public const string HttpClientName = "CartesiaTTS";

    #endregion

    #region Fields

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly CartesiaTtsClientSettings _settings;

    #endregion

    #region Constructor

    public CartesiaTtsClient(
        IHttpClientFactory httpClientFactory,
        IOptions<CartesiaTtsClientSettings> options)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _settings          = options.Value;
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Streams synthesised audio via <c>POST /tts/bytes</c>.
    /// The returned <see cref="Stream"/> owns the underlying HTTP response;
    /// callers must dispose it to return the connection to the pool.
    /// </summary>
    internal async Task<Stream> TextToSpeechStreamAsync(
        string apiKey,
        CartesiaSpeechOptions options,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentNullException.ThrowIfNull(options);

        using var request = CartesiaRequestFactory.CreateTextToSpeechRequest(
            _settings.Endpoint, apiKey, _settings.ApiVersion, options);

        return await SendAndReadStreamAsync(request, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Returns available voices via <c>GET /voices</c>.
    /// </summary>
    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        string apiKey,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);

        using var request = CartesiaRequestFactory.CreateGetVoicesRequest(
            _settings.Endpoint, apiKey, _settings.ApiVersion);

        await using var stream = await SendAndReadStreamAsync(request, ct).ConfigureAwait(false);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);

        return ParseVoices(doc.RootElement);
    }

    #endregion

    #region Private Methods

    private HttpClient CreateClient() => _httpClientFactory.CreateClient(HttpClientName);

    private async Task<CartesiaResponseStream> SendAndReadStreamAsync(
        HttpRequestMessage request,
        CancellationToken ct)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct)
            .ConfigureAwait(false);

        await CartesiaErrorHandler.ThrowIfFailedAsync(response, ct).ConfigureAwait(false);

        var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        return new CartesiaResponseStream(stream, response);
    }

    /// <summary>
    /// Cartesia <c>GET /voices</c> returns a JSON array:
    /// <c>[{ "id": "uuid", "name": "...", "language": "en", "is_public": true }]</c>
    /// </summary>
    private static SpeechVoiceCollection ParseVoices(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Array)
            return new SpeechVoiceCollection([]);

        var result = new List<SpeechVoice>();

        foreach (var item in root.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;

            var id = TryGetString(item, "id");
            if (string.IsNullOrWhiteSpace(id)) continue;

            var name     = TryGetString(item, "name");
            var language = TryGetString(item, "language");
            var desc     = TryGetString(item, "description");

            IReadOnlyDictionary<string, string>? labels = null;
            if (desc is not null)
                labels = new Dictionary<string, string> { ["description"] = desc };

            result.Add(new SpeechVoice(id, name, language, labels));
        }

        return new SpeechVoiceCollection(result);
    }

    private static string? TryGetString(JsonElement el, string prop)
    {
        if (el.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String)
            return v.GetString();
        return null;
    }

    #endregion
}
