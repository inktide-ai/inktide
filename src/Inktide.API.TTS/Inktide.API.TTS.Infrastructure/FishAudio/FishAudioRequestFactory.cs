using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Flurl;

namespace Inktide.API.TTS.Infrastructure.FishAudio;

internal static class FishAudioRequestFactory
{
    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy   = null,
    };

    /// <summary>
    /// <c>POST /v1/tts</c>
    /// Auth:  <c>Authorization: Bearer {apiKey}</c>
    /// Model: <c>model: {model}</c> header (Fish Audio engine selection).
    /// </summary>
    internal static HttpRequestMessage CreateTextToSpeechRequest(
        Uri baseUri,
        string apiKey,
        string model,
        FishAudioSpeechOptions options)
    {
        var uri = baseUri
            .AppendPathSegment("v1")
            .AppendPathSegment("tts");

        var request = new HttpRequestMessage(HttpMethod.Post, uri);
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {apiKey}");
        request.Headers.TryAddWithoutValidation("model", model);
        request.Content = JsonContent.Create(options, options: JsonOptions);
        return request;
    }

    /// <summary>
    /// <c>GET /v1/voices?page_size={pageSize}&amp;sort_by=task_count</c>
    /// Returns the most-used voices for voice catalogue browsing.
    /// </summary>
    internal static HttpRequestMessage CreateGetVoicesRequest(
        Uri baseUri,
        string apiKey,
        int pageSize)
    {
        var uri = baseUri
            .AppendPathSegment("v1")
            .AppendPathSegment("voices")
            .AppendQueryParam("page_size", pageSize)
            .AppendQueryParam("sort_by", "task_count");

        var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {apiKey}");
        request.Headers.TryAddWithoutValidation("Accept", "application/json");
        return request;
    }
}
