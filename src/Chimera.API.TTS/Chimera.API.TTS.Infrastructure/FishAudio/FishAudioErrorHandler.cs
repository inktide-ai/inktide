using System.Text.Json;

namespace Chimera.API.TTS.Infrastructure.FishAudio;

internal static class FishAudioErrorHandler
{
    internal static async Task ThrowIfFailedAsync(
        HttpResponseMessage response,
        CancellationToken ct)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var rawBody = await response.Content
            .ReadAsStringAsync(ct)
            .ConfigureAwait(false);

        var statusCode   = (int)response.StatusCode;
        var reasonPhrase = response.ReasonPhrase;

        response.Dispose();

        var detail = TryExtractMessage(rawBody);
        if (detail is not null)
        {
            throw new HttpRequestException($"Fish Audio returned {statusCode}: {detail}");
        }

        var body = string.IsNullOrWhiteSpace(rawBody)
            ? reasonPhrase ?? "Unknown error"
            : rawBody.Length <= 2_048 ? rawBody : string.Concat(rawBody.AsSpan(0, 2_048), "…");

        throw new HttpRequestException($"Fish Audio returned {statusCode}. {body}");
    }

    /// <summary>
    /// Extracts <c>message</c> or <c>detail</c> from the Fish Audio error JSON body.
    /// </summary>
    private static string? TryExtractMessage(string? content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;

        try
        {
            using var doc  = JsonDocument.Parse(content);
            var root = doc.RootElement;

            foreach (var candidate in new[] { "message", "detail", "error" })
            {
                if (!root.TryGetProperty(candidate, out var el)) continue;

                if (el.ValueKind == JsonValueKind.String)
                    return el.GetString();

                if (el.ValueKind == JsonValueKind.Object)
                {
                    if (el.TryGetProperty("message", out var inner) &&
                        inner.ValueKind == JsonValueKind.String)
                        return inner.GetString();
                }
            }

            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
