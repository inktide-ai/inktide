using System.Net;

namespace Chimera.API.TTS.Infrastructure.Kokoro;

/// <summary>
/// HTTP error handling for Kokoro TTS responses (readable helpers, separate from request/response protocol).
/// </summary>
public sealed partial class KokoroTtsClient
{
    #region Private Methods

    private static async Task ThrowIfKokoroRequestFailedAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var rawBody = await ReadRawErrorContentAsync(response, cancellationToken).ConfigureAwait(false);

        var statusCode = response.StatusCode;
        var statusNumeric = (int)statusCode;
        var reasonPhrase = response.ReasonPhrase;

        response.Dispose();

        var structuredError = SpeechServiceHttpError.TryCreateFromContent(rawBody ?? string.Empty);
        if (structuredError is not null)
        {
            throw new HttpRequestException(structuredError.ToExceptionMessage(statusNumeric));
        }

        var detail = BuildFallbackErrorDetail(rawBody, reasonPhrase);

        throw CreateKokoroHttpException(statusNumeric, statusCode, detail);
    }

    private static async Task<string?> ReadRawErrorContentAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        return await response.Content
            .ReadAsStringAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    private static string BuildFallbackErrorDetail(string? rawBody, string? responseReason)
    {
        if (string.IsNullOrWhiteSpace(rawBody))
        {
            return responseReason ?? "Unknown error";
        }

        return TrimErrorBodyForMessage(rawBody, maxLength: 2_048);
    }

    private static HttpRequestException CreateKokoroHttpException(
        int statusNumeric,
        HttpStatusCode statusCode,
        string detail)
    {
        return new HttpRequestException(
            $"Kokoro TTS returned {statusNumeric} ({statusCode}). {detail}");
    }

    private static string TrimErrorBodyForMessage(string text, int maxLength)
    {
        return text.Length <= maxLength
            ? text
            : string.Concat(text.AsSpan(0, maxLength), "…");
    }

    #endregion
}
