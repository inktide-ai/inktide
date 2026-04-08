using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Flurl;

namespace Chimera.API.TTS.Infrastructure.ElevenLabs;

internal static class ElevenLabsRequestFactory
{
    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = null,
    };

    /// <summary>
    /// <c>POST /v1/text-to-speech/{voiceId}/stream?output_format={format}</c>
    /// </summary>
    internal static HttpRequestMessage CreateTextToSpeechStreamRequest(
        Uri baseUri,
        string voiceId,
        string apiKey,
        string outputFormat,
        ElevenLabsSpeechOptions options)
    {
        var uri = baseUri
            .AppendPathSegment("v1")
            .AppendPathSegment("text-to-speech")
            .AppendPathSegment(voiceId)
            .AppendPathSegment("stream")
            .AppendQueryParam("output_format", outputFormat);

        var request = new HttpRequestMessage(HttpMethod.Post, uri);
        request.Headers.TryAddWithoutValidation("xi-api-key", apiKey);
        request.Content = JsonContent.Create(options, options: JsonOptions);
        return request;
    }

    /// <summary>
    /// <c>GET /v1/voices</c>
    /// </summary>
    internal static HttpRequestMessage CreateGetVoicesRequest(Uri baseUri, string apiKey)
    {
        var uri = baseUri
            .AppendPathSegment("v1")
            .AppendPathSegment("voices");

        var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.TryAddWithoutValidation("xi-api-key", apiKey);
        request.Headers.TryAddWithoutValidation("Accept", "application/json");
        return request;
    }

    /// <summary>
    /// <c>GET /v1/models</c> — public endpoint, no API key required.
    /// </summary>
    internal static HttpRequestMessage CreateGetModelsRequest(Uri baseUri)
    {
        var uri = baseUri
            .AppendPathSegment("v1")
            .AppendPathSegment("models");

        var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.TryAddWithoutValidation("Accept", "application/json");
        return request;
    }
}
