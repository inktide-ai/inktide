using System.Text.Json;
using Inktide.API.TTS.Domain.Models;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.FishAudio;

/// <summary>
/// Raw HTTP client for the Fish Audio v1 REST API.
/// </summary>
public sealed class FishAudioTtsClient
{

    public const string HttpClientName = "FishAudioTTS";


    private readonly IHttpClientFactory _httpClientFactory;
    private readonly FishAudioTtsClientSettings _settings;


    public FishAudioTtsClient(
        IHttpClientFactory httpClientFactory,
        IOptions<FishAudioTtsClientSettings> options)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _settings          = options.Value;
    }


    /// <summary>
    /// Streams synthesised audio via <c>POST /v1/tts</c>.
    /// The returned <see cref="Stream"/> owns the underlying HTTP response;
    /// callers must dispose it to return the connection to the pool.
    /// </summary>
    internal async Task<Stream> TextToSpeechStreamAsync(
        string voiceId,
        string apiKey,
        string model,
        FishAudioSpeechOptions options,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(voiceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentNullException.ThrowIfNull(options);

        options.ReferenceId = voiceId;

        using var request = FishAudioRequestFactory.CreateTextToSpeechRequest(
            _settings.Endpoint, apiKey, model, options);

        return await SendAndReadStreamAsync(request, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Returns the first page of public voices, sorted by usage, via <c>GET /v1/voices</c>.
    /// </summary>
    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        string apiKey,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);

        using var request = FishAudioRequestFactory.CreateGetVoicesRequest(
            _settings.Endpoint, apiKey, _settings.VoiceListPageSize);

        await using var stream = await SendAndReadStreamAsync(request, ct).ConfigureAwait(false);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);

        return ParseVoices(doc.RootElement);
    }


    private HttpClient CreateClient() => _httpClientFactory.CreateClient(HttpClientName);

    private async Task<FishAudioResponseStream> SendAndReadStreamAsync(
        HttpRequestMessage request,
        CancellationToken ct)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct)
            .ConfigureAwait(false);

        await FishAudioErrorHandler.ThrowIfFailedAsync(response, ct).ConfigureAwait(false);

        var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        return new FishAudioResponseStream(stream, response);
    }

    /// <summary>
    /// Parses <c>GET /v1/voices</c> response.
    /// Fish Audio returns <c>{ total, items: [{ _id, title, description, tags, language }] }</c>.
    /// </summary>
    private static SpeechVoiceCollection ParseVoices(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object)
            return new SpeechVoiceCollection([]);

        // Support both "items" (SDK docs) and "data" (some response variants)
        JsonElement array = default;
        if (!root.TryGetProperty("items", out array) || array.ValueKind != JsonValueKind.Array)
        {
            if (!root.TryGetProperty("data", out array) || array.ValueKind != JsonValueKind.Array)
                return new SpeechVoiceCollection([]);
        }

        var result = new List<SpeechVoice>();

        foreach (var item in array.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;

            // Voice ID may be "_id" or "id" depending on the endpoint version
            var id = TryGetString(item, "_id") ?? TryGetString(item, "id");
            if (string.IsNullOrWhiteSpace(id)) continue;

            var name = TryGetString(item, "title");

            // language comes as a string like "en-US" or "zh"
            string? category = TryGetString(item, "language");

            IReadOnlyDictionary<string, string>? labels = null;
            if (item.TryGetProperty("tags", out var tagsEl) && tagsEl.ValueKind == JsonValueKind.Array)
            {
                var tags = new List<string>();
                foreach (var tag in tagsEl.EnumerateArray())
                {
                    if (tag.ValueKind == JsonValueKind.String)
                    {
                        var t = tag.GetString();
                        if (!string.IsNullOrWhiteSpace(t)) tags.Add(t);
                    }
                }
                if (tags.Count > 0)
                    labels = new Dictionary<string, string> { ["tags"] = string.Join(", ", tags) };
            }

            result.Add(new SpeechVoice(id, name, category, labels));
        }

        return new SpeechVoiceCollection(result);
    }

    private static string? TryGetString(JsonElement el, string propertyName)
    {
        if (el.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String)
            return prop.GetString();
        return null;
    }

}
