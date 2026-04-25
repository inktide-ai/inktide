using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Inktide.API.TTS.Domain.Models;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.AzureSpeech;

/// <summary>
/// Raw HTTP client for the Azure Cognitive Services Speech REST API.
/// </summary>
public sealed class AzureSpeechTtsClient
{

    public const string HttpClientName = "AzureSpeechTTS";

    private const string SubscriptionKeyHeader = "Ocp-Apim-Subscription-Key";


    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AzureSpeechTtsClientSettings _settings;


    public AzureSpeechTtsClient(
        IHttpClientFactory httpClientFactory,
        IOptions<AzureSpeechTtsClientSettings> options)
    {
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _settings          = options.Value;
    }


    /// <summary>
    /// Streams synthesised audio via
    /// <c>POST https://{region}.tts.speech.microsoft.com/cognitiveservices/v1</c>.
    /// The returned <see cref="Stream"/> owns the underlying HTTP response;
    /// callers must dispose it to return the connection to the pool.
    /// </summary>
    public async Task<Stream> TextToSpeechStreamAsync(
        string apiKey,
        string endpoint,
        string ssml,
        string outputFormat,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(ssml);

        var uri = $"{endpoint.TrimEnd('/')}/cognitiveservices/v1";

        using var request = new HttpRequestMessage(HttpMethod.Post, uri);
        request.Headers.TryAddWithoutValidation(SubscriptionKeyHeader, apiKey);
        request.Headers.TryAddWithoutValidation("X-Microsoft-OutputFormat", outputFormat);
        request.Headers.TryAddWithoutValidation("User-Agent", "inktide");
        request.Content = new StringContent(ssml, Encoding.UTF8, "application/ssml+xml");

        var client   = CreateClient();
        var response = await client
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct)
            .ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            throw new HttpRequestException(
                $"Azure Speech synthesis failed ({(int)response.StatusCode}): {body}",
                null,
                response.StatusCode);
        }

        var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        return new AzureSpeechResponseStream(stream, response);
    }

    /// <summary>
    /// Returns the list of available voices via
    /// <c>GET https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list</c>.
    /// </summary>
    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        string apiKey,
        string endpoint,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);

        var uri = $"{endpoint.TrimEnd('/')}/cognitiveservices/voices/list";

        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.TryAddWithoutValidation(SubscriptionKeyHeader, apiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var client   = CreateClient();
        var response = await client
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct)
            .ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            throw new HttpRequestException(
                $"Azure Speech voice listing failed ({(int)response.StatusCode}): {body}",
                null,
                response.StatusCode);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);

        return ParseVoices(doc.RootElement);
    }


    private HttpClient CreateClient() => _httpClientFactory.CreateClient(HttpClientName);

    /// <summary>
    /// Azure voices/list returns a JSON array:
    /// <c>[{ "ShortName": "en-US-JennyNeural", "LocalName": "Jenny", "Locale": "en-US", ... }]</c>
    /// </summary>
    private static SpeechVoiceCollection ParseVoices(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Array)
            return new SpeechVoiceCollection([]);

        var result = new List<SpeechVoice>();

        foreach (var item in root.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;

            var id = TryGetString(item, "ShortName");
            if (string.IsNullOrWhiteSpace(id)) continue;

            var name     = TryGetString(item, "LocalName") ?? TryGetString(item, "DisplayName");
            var locale   = TryGetString(item, "Locale");
            var gender   = TryGetString(item, "Gender");
            var type     = TryGetString(item, "VoiceType");

            IReadOnlyDictionary<string, string>? labels = null;
            if (gender is not null || type is not null)
            {
                var d = new Dictionary<string, string>();
                if (gender is not null) d["gender"]    = gender;
                if (type   is not null) d["voiceType"] = type;
                labels = d;
            }

            result.Add(new SpeechVoice(id, name, locale, labels));
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
