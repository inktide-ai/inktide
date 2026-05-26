using System.Text.Json;
using Inktide.API.TTS.Domain.Models;
using Inktide.API.TTS.Infrastructure;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.ElevenLabs;

/// <summary>
/// Raw HTTP client for the ElevenLabs v1 REST API.
/// </summary>
public sealed class ElevenLabsTtsClient
{

    public const string HttpClientName = "ElevenLabsTTS";


    private readonly IHttpClientFactory _httpClientFactory;

    private readonly Uri _baseUri;


    public ElevenLabsTtsClient(
        IHttpClientFactory httpClientFactory,
        IOptions<ElevenLabsTtsClientSettings> options)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _baseUri = options.Value.Endpoint;
    }


    /// <summary>
    /// Streams synthesised audio via <c>POST /v1/text-to-speech/{voiceId}/stream</c>.
    /// The returned <see cref="Stream"/> owns the underlying HTTP response;
    /// callers must dispose it to return the connection to the pool.
    /// </summary>
    public async Task<Stream> TextToSpeechStreamAsync(
        string voiceId,
        string apiKey,
        string outputFormat,
        ElevenLabsSpeechOptions options,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(voiceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentNullException.ThrowIfNull(options);

        using var request = ElevenLabsRequestFactory.CreateTextToSpeechStreamRequest(
            _baseUri, voiceId, apiKey, outputFormat, options);

        return await SendAndReadStreamAsync(request, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Returns all available voices via <c>GET /v1/voices</c>.
    /// </summary>
    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        string apiKey,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);

        using var request = ElevenLabsRequestFactory.CreateGetVoicesRequest(_baseUri, apiKey);

        await using var stream = await SendAndReadStreamAsync(request, ct).ConfigureAwait(false);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);

        return ParseVoices(doc.RootElement);
    }

    /// <summary>
    /// Returns all TTS-capable models via <c>GET /v1/models</c>.
    /// This endpoint is public and does not require an API key.
    /// </summary>
    public async Task<SpeechModelCollection> GetModelsAsync(CancellationToken ct = default)
    {
        using var request = ElevenLabsRequestFactory.CreateGetModelsRequest(_baseUri);

        await using var stream = await SendAndReadStreamAsync(request, ct).ConfigureAwait(false);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);

        return ParseModels(doc.RootElement);
    }


    private HttpClient CreateClient() => _httpClientFactory.CreateClient(HttpClientName);

    private async Task<HttpResponseStream> SendAndReadStreamAsync(
        HttpRequestMessage request,
        CancellationToken ct)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct)
            .ConfigureAwait(false);

        await ElevenLabsErrorHandler.ThrowIfFailedAsync(response, ct).ConfigureAwait(false);

        var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        return new HttpResponseStream(stream, response);
    }

    /// <summary>
    /// Parses the ElevenLabs <c>/v1/voices</c> response, extracting id, name,
    /// category and labels for each voice.
    /// </summary>
    private static SpeechVoiceCollection ParseVoices(JsonElement root)
    {
        if (!root.TryGetProperty("voices", out var voices) ||
            voices.ValueKind != JsonValueKind.Array)
        {
            return new SpeechVoiceCollection([]);
        }

        var result = new List<SpeechVoice>();

        foreach (var voice in voices.EnumerateArray())
        {
            if (voice.ValueKind != JsonValueKind.Object) continue;

            var id = voice.GetStringOrNull("voice_id");
            if (string.IsNullOrWhiteSpace(id)) continue;

            var name     = voice.GetStringOrNull("name");
            var category = voice.GetStringOrNull("category");

            IReadOnlyDictionary<string, string>? labels = null;
            if (voice.TryGetProperty("labels", out var labelsEl) &&
                labelsEl.ValueKind == JsonValueKind.Object)
            {
                var dict = new Dictionary<string, string>();
                foreach (var prop in labelsEl.EnumerateObject())
                {
                    if (prop.Value.ValueKind == JsonValueKind.String)
                        dict[prop.Name] = prop.Value.GetString()!;
                }
                if (dict.Count > 0) labels = dict;
            }

            result.Add(new SpeechVoice(id, name, category, labels));
        }

        return new SpeechVoiceCollection(result);
    }

    /// <summary>
    /// Parses the ElevenLabs <c>/v1/models</c> response (bare JSON array).
    /// Filters to models that support text-to-speech.
    /// </summary>
    private static SpeechModelCollection ParseModels(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Array)
        {
            return new SpeechModelCollection("list", []);
        }

        var models = new List<SpeechModel>();

        foreach (var el in root.EnumerateArray())
        {
            if (el.ValueKind != JsonValueKind.Object) continue;

            if (el.TryGetProperty("can_do_text_to_speech", out var ttsFlag) &&
                ttsFlag.ValueKind == JsonValueKind.False)
            {
                continue;
            }

            var id = el.GetStringOrNull("model_id");
            if (string.IsNullOrWhiteSpace(id)) continue;

            models.Add(new SpeechModel(id, "model", DateTimeOffset.UnixEpoch, "elevenlabs"));
        }

        return new SpeechModelCollection("list", models);
    }

}
