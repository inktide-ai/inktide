using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Inktide.API.TTS.Domain.Models;
using Flurl;

namespace Inktide.API.TTS.Infrastructure.Kokoro;

internal static class KokoroRequestFactory
{
    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = null,
    };

    internal static HttpRequestMessage CreateGenerateSpeechRequest(Uri endpoint, KokoroSpeechOptions options)
    {
        var uri =
            endpoint
                .AppendPathSegment("audio")
                .AppendPathSegment("speech");

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, uri);
        httpRequest.Content = JsonContent.Create(options, options: JsonOptions);
        return httpRequest;
    }

    internal static HttpRequestMessage CreateGetModelsRequest(Uri endpoint)
    {
        var uri =
            endpoint
                .AppendPathSegment("models");

        var httpRequest = new HttpRequestMessage(HttpMethod.Get, uri);
        httpRequest.Headers.TryAddWithoutValidation("Accept", "application/json");
        return httpRequest;
    }

    internal static HttpRequestMessage CreateGetModelRequest(Uri endpoint, string modelId)
    {
        var uri =
            endpoint
                .AppendPathSegment("models")
                .AppendPathSegment(modelId);

        var httpRequest = new HttpRequestMessage(HttpMethod.Get, uri);
        httpRequest.Headers.TryAddWithoutValidation("Accept", "application/json");
        return httpRequest;
    }

    internal static HttpRequestMessage CreateGetVoicesRequest(Uri endpoint)
    {
        var uri =
            endpoint
                .AppendPathSegment("audio")
                .AppendPathSegment("voices");

        var httpRequest = new HttpRequestMessage(HttpMethod.Get, uri);
        httpRequest.Headers.TryAddWithoutValidation("Accept", "application/json");
        return httpRequest;
    }

    internal static HttpRequestMessage CreateDownloadFileRequest(Uri endpoint, string filename)
    {
        var safe = KokoroDownloadFilename.Sanitize(filename);

        var uri =
            endpoint
                .AppendPathSegment("download")
                .AppendPathSegment(safe);

        var httpRequest = new HttpRequestMessage(HttpMethod.Get, uri);
        httpRequest.Headers.TryAddWithoutValidation("Accept", "*/*");
        return httpRequest;
    }

    internal static HttpRequestMessage CreateCombineVoicesRequest(Uri endpoint, string jsonBody)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(jsonBody);

        var uri =
            endpoint
                .AppendPathSegment("audio")
                .AppendPathSegment("voices")
                .AppendPathSegment("combine");

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, uri);
        httpRequest.Headers.TryAddWithoutValidation("Accept", "*/*");
        httpRequest.Content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");
        return httpRequest;
    }
}
