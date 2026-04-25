using System.Net;

namespace Inktide.API.TTS.Infrastructure.Kokoro;

internal static class KokoroErrorHandler
{
    internal static async Task ThrowIfKokoroRequestFailedAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var rawBody = await response.Content
            .ReadAsStringAsync(cancellationToken)
            .ConfigureAwait(false);

        var statusCode = response.StatusCode;
        var statusNumeric = (int)statusCode;
        var reasonPhrase = response.ReasonPhrase;

        response.Dispose();

        var structuredError = SpeechServiceHttpError.TryCreateFromContent(rawBody ?? string.Empty);
        if (structuredError is not null)
        {
            throw new HttpRequestException(structuredError.ToExceptionMessage(statusNumeric));
        }

        var detail = string.IsNullOrWhiteSpace(rawBody)
            ? reasonPhrase ?? "Unknown error"
            : rawBody.Length <= 2_048 ? rawBody : string.Concat(rawBody.AsSpan(0, 2_048), "…");

        throw new HttpRequestException(
            $"Kokoro TTS returned {statusNumeric} ({statusCode}). {detail}");
    }
}
