using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Chimera.API.TTS.Domain.Models;
using Flurl;

namespace Chimera.API.TTS.Infrastructure.Kokoro;

public sealed partial class KokoroTtsClient
{
    
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = null,
    };
    
    #region Methods
    
    internal HttpRequestMessage CreateGenerateSpeechRequest(KokoroSpeechOptions options)
    {
        var uri = 
            _endpoint
            .AppendPathSegment("audio")
            .AppendPathSegment("speech");
        
        var httpRequest = new HttpRequestMessage(
            HttpMethod.Post,
            uri);

        httpRequest.Content = JsonContent.Create(options, options: JsonOptions);
        
        return httpRequest;
    }
    
    internal HttpRequestMessage CreateGetModelsRequest()
    {
        var uri =
            _endpoint
            .AppendPathSegment("models");
        
        var httpRequest = new HttpRequestMessage(
            HttpMethod.Get,
            uri);
        
        httpRequest.Headers.TryAddWithoutValidation("Accept", "application/json");
        
        return httpRequest;
    }
    
    internal HttpRequestMessage CreateGetModelRequest(string modelId)
    {
        var uri =
            _endpoint
                .AppendPathSegment("models")
                .AppendPathSegment(modelId);
        
        var httpRequest = new HttpRequestMessage(
            HttpMethod.Get,
            uri);
        
        httpRequest.Headers.TryAddWithoutValidation("Accept", "application/json");
        
        return httpRequest;
    }
    
    internal HttpRequestMessage CreateGetVoicesRequest()
    {
        var uri =
            _endpoint
            .AppendPathSegment("audio")
            .AppendPathSegment("voices");
        
        var httpRequest = new HttpRequestMessage(
            HttpMethod.Get,
            uri);
        
        httpRequest.Headers.TryAddWithoutValidation("Accept", "application/json");
        
        return httpRequest;
    }

    internal HttpRequestMessage CreateDownloadFileRequest(string filename)
    {
        var safe = KokoroDownloadFilename.Sanitize(filename);

        var uri =
            _endpoint
                .AppendPathSegment("download")
                .AppendPathSegment(safe);

        var httpRequest = new HttpRequestMessage(HttpMethod.Get, uri);
        httpRequest.Headers.TryAddWithoutValidation("Accept", "*/*");
        return httpRequest;
    }

    internal HttpRequestMessage CreateCombineVoicesRequest(string jsonBody)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(jsonBody);

        var uri =
            _endpoint
                .AppendPathSegment("audio")
                .AppendPathSegment("voices")
                .AppendPathSegment("combine");

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, uri);
        httpRequest.Headers.TryAddWithoutValidation("Accept", "*/*");
        httpRequest.Content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");
        return httpRequest;
    }

  

    #endregion
}