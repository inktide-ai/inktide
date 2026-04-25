using System.Text.Json;
using Inktide.API.TTS.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// HTTP client for Kokoro TTS OpenAPI-compatible endpoints.
/// </summary>
public sealed class KokoroTtsClient
{

    private const string KokoroTtsV1Endpoint = "http://localhost:8880/v1";

    public const string HttpClientName = "KokoroTTS";


    private readonly IHttpClientFactory _httpClientFactory;

    private readonly ILogger<KokoroTtsClient>? _logger;

    private readonly Uri _endpoint;


    public KokoroTtsClient(
        IHttpClientFactory httpChannelFactory,
        IOptions<KokoroTtsClientSettings> options,
        ILogger<KokoroTtsClient>? logger)
    {
        _httpClientFactory = httpChannelFactory ?? throw new ArgumentNullException(nameof(httpChannelFactory));
        _logger = logger;
        _endpoint = GetEndpoint(options.Value);
    }


    public Uri Endpoint => _endpoint;


    public async Task<Stream> GenerateSpeechAsync(
        KokoroSpeechOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options.Input);

        using var httpRequest = KokoroRequestFactory.CreateGenerateSpeechRequest(_endpoint, options);
        return await SendAndReadContentStreamAsync(httpRequest, cancellationToken).ConfigureAwait(false);
    }

    public async Task<SpeechModelCollection> GetModelsAsync(
        CancellationToken cancellationToken = default)
    {
        using var httpRequest = KokoroRequestFactory.CreateGetModelsRequest(_endpoint);

        await using var stream = await SendAndReadContentStreamAsync(httpRequest, cancellationToken)
            .ConfigureAwait(false);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return SpeechModelCollection.FromResponse(doc.RootElement);
    }

    public async Task<SpeechModel> GetModelAsync(
        string modelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(modelId);

        using var httpRequest = KokoroRequestFactory.CreateGetModelRequest(_endpoint, modelId);

        await using var stream = await SendAndReadContentStreamAsync(httpRequest, cancellationToken)
            .ConfigureAwait(false);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return SpeechModel.FromResponse(doc.RootElement);
    }

    public async Task<SpeechVoiceCollection> GetVoicesAsync(
        CancellationToken cancellationToken = default)
    {
        using var httpRequest = KokoroRequestFactory.CreateGetVoicesRequest(_endpoint);

        await using var stream = await SendAndReadContentStreamAsync(httpRequest, cancellationToken)
            .ConfigureAwait(false);

        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return SpeechVoiceCollection.FromResponse(doc.RootElement);
    }

    /// <summary>
    /// <c>GET /v1/download/{filename}</c> — download a generated file from Kokoro temp storage.
    /// </summary>
    public async Task<KokoroHttpStreamResult> DownloadGeneratedFileAsync(
        string filename,
        CancellationToken cancellationToken = default)
    {
        using var httpRequest = KokoroRequestFactory.CreateDownloadFileRequest(_endpoint, filename);
        return await SendAndReadBinaryResultAsync(httpRequest, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// <c>POST /v1/audio/voices/combine</c> — body must be JSON (string or array of strings per OpenAPI).
    /// </summary>
    public async Task<KokoroHttpStreamResult> CombineVoicesAsync(
        string requestJsonBody,
        CancellationToken cancellationToken = default)
    {
        using var httpRequest = KokoroRequestFactory.CreateCombineVoicesRequest(_endpoint, requestJsonBody);
        return await SendAndReadBinaryResultAsync(httpRequest, cancellationToken).ConfigureAwait(false);
    }


    internal static Uri GetEndpoint(KokoroTtsClientSettings? options = null)
    {
        return options?.Endpoint ?? new(KokoroTtsV1Endpoint);
    }


    private HttpClient CreateClient() => _httpClientFactory.CreateClient(HttpClientName);

    private async Task<Stream> SendAndReadContentStreamAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
            .ConfigureAwait(false);

        await KokoroErrorHandler.ThrowIfKokoroRequestFailedAsync(response, cancellationToken)
            .ConfigureAwait(false);

        return await response.Content
            .ReadAsStreamAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<KokoroHttpStreamResult> SendAndReadBinaryResultAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
            .ConfigureAwait(false);

        await KokoroErrorHandler.ThrowIfKokoroRequestFailedAsync(response, cancellationToken)
            .ConfigureAwait(false);

        var mediaType = response.Content.Headers.ContentType?.MediaType;
        var stream = await response.Content
            .ReadAsStreamAsync(cancellationToken)
            .ConfigureAwait(false);

        return new KokoroHttpStreamResult
        {
            Stream = stream,
            MediaType = mediaType,
        };
    }

}
