using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Flurl;

namespace Inktide.API.TTS.Infrastructure.Cartesia;

internal static class CartesiaRequestFactory
{

    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy   = null,
    };


    /// <summary>
    /// <c>POST /tts/bytes</c>
    /// Auth:    <c>X-API-Key: {apiKey}</c>
    /// Version: <c>Cartesia-Version: {version}</c>
    /// </summary>
    internal static HttpRequestMessage CreateTextToSpeechRequest(
        Uri baseUri,
        string apiKey,
        string apiVersion,
        CartesiaSpeechOptions options)
    {
        var uri = baseUri.AppendPathSegment("tts").AppendPathSegment("bytes");

        var request = new HttpRequestMessage(HttpMethod.Post, uri);
        request.Headers.TryAddWithoutValidation("X-API-Key",         apiKey);
        request.Headers.TryAddWithoutValidation("Cartesia-Version",  apiVersion);
        request.Content = JsonContent.Create(options, options: JsonOptions);
        return request;
    }

    /// <summary>
    /// <c>GET /voices</c>
    /// Auth: <c>X-API-Key: {apiKey}</c>
    /// </summary>
    internal static HttpRequestMessage CreateGetVoicesRequest(
        Uri baseUri,
        string apiKey,
        string apiVersion)
    {
        var uri = baseUri.AppendPathSegment("voices");

        var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.TryAddWithoutValidation("X-API-Key",         apiKey);
        request.Headers.TryAddWithoutValidation("Cartesia-Version",  apiVersion);
        request.Headers.TryAddWithoutValidation("Accept",            "application/json");
        return request;
    }

}
