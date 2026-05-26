using System.Text.Json;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Infrastructure;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.Cartesia;

/// <summary>
/// Raw HTTP client for the Cartesia TTS REST API.
/// </summary>
public sealed class CartesiaTtsClient
{

    public const string HttpClientName = "CartesiaTTS";


    private readonly IHttpClientFactory _httpClientFactory;
    private readonly CartesiaTtsClientSettings _settings;


    public CartesiaTtsClient(
        IHttpClientFactory httpClientFactory,
        IOptions<CartesiaTtsClientSettings> options)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _settings          = options.Value;
    }


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


    private HttpClient CreateClient() => _httpClientFactory.CreateClient(HttpClientName);

    private async Task<HttpResponseStream> SendAndReadStreamAsync(
        HttpRequestMessage request,
        CancellationToken ct)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct)
            .ConfigureAwait(false);

        await CartesiaErrorHandler.ThrowIfFailedAsync(response, ct).ConfigureAwait(false);

        var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        return new HttpResponseStream(stream, response);
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

            var id = item.GetStringOrNull("id");
            if (string.IsNullOrWhiteSpace(id)) continue;

            var name     = item.GetStringOrNull("name");
            var language = item.GetStringOrNull("language");
            var desc     = item.GetStringOrNull("description");

            IReadOnlyDictionary<string, string>? labels = null;
            if (desc is not null)
                labels = new Dictionary<string, string> { ["description"] = desc };

            result.Add(new SpeechVoice(id, name, language, labels));
        }

        return new SpeechVoiceCollection(result);
    }

}
