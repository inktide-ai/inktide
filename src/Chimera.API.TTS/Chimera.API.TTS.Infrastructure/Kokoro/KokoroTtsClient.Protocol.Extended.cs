namespace Chimera.API.TTS.Infrastructure.Kokoro;

public sealed partial class KokoroTtsClient
{
    #region Public Methods

    /// <summary>
    /// <c>GET /v1/download/{filename}</c> — download a generated file from Kokoro temp storage.
    /// </summary>
    public async Task<KokoroHttpStreamResult> DownloadGeneratedFileAsync(
        string filename,
        CancellationToken cancellationToken = default)
    {
        using var httpRequest = CreateDownloadFileRequest(filename);
        return await SendAndReadBinaryResultAsync(httpRequest, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// <c>POST /v1/audio/voices/combine</c> — body must be JSON (string or array of strings per OpenAPI).
    /// </summary>
    public async Task<KokoroHttpStreamResult> CombineVoicesAsync(
        string requestJsonBody,
        CancellationToken cancellationToken = default)
    {
        using var httpRequest = CreateCombineVoicesRequest(requestJsonBody);
        return await SendAndReadBinaryResultAsync(httpRequest, cancellationToken).ConfigureAwait(false);
    }

    #endregion

    #region Private Methods

    private async Task<KokoroHttpStreamResult> SendAndReadBinaryResultAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var response = await CreateClient()
            .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
            .ConfigureAwait(false);

        await ThrowIfKokoroRequestFailedAsync(response, cancellationToken).ConfigureAwait(false);

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

    #endregion
}
