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


    internal static Uri GetEndpoint(KokoroTtsClientSettings settings) =>
        settings.Endpoint
            ?? throw new InvalidOperationException(
                "Kokoro TTS endpoint is required. Configure KokoroTts:Endpoint in appsettings or as an environment variable.");


    private HttpClient CreateClient() => _httpClientFactory.CreateClient(HttpClientName);

    private async Task<HttpResponseStream> SendAndReadContentStreamAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
            .ConfigureAwait(false);

        await KokoroErrorHandler.ThrowIfKokoroRequestFailedAsync(response, cancellationToken)
            .ConfigureAwait(false);

        var stream = await response.Content
            .ReadAsStreamAsync(cancellationToken)
            .ConfigureAwait(false);

        return new HttpResponseStream(stream, response);
    }

}
