using System.Text.Json;

namespace Chimera.API.TTS.Infrastructure.Cartesia;

internal static class CartesiaErrorHandler
{
    internal static async Task ThrowIfFailedAsync(
        HttpResponseMessage response,
        CancellationToken ct)
    {
        if (response.IsSuccessStatusCode)
            return;

        var rawBody = await response.Content
            .ReadAsStringAsync(ct)
            .ConfigureAwait(false);

        var statusCode   = (int)response.StatusCode;
        var reasonPhrase = response.ReasonPhrase;

        response.Dispose();

        var detail = TryExtractDetail(rawBody);
        if (detail is not null)
        {
            throw new HttpRequestException($"Cartesia returned {statusCode}: {detail}");
        }

        var body = string.IsNullOrWhiteSpace(rawBody)
            ? reasonPhrase ?? "Unknown error"
            : rawBody.Length <= 2_048 ? rawBody : string.Concat(rawBody.AsSpan(0, 2_048), "…");

        throw new HttpRequestException($"Cartesia returned {statusCode} ({response.StatusCode}). {body}");
    }

    private static string? TryExtractDetail(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return null;

        try
        {
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            // Cartesia error body: { "error": "...", "message": "..." }
            foreach (var key in new[] { "message", "error", "detail" })
            {
                if (root.TryGetProperty(key, out var el) &&
                    el.ValueKind == JsonValueKind.String)
                {
                    return el.GetString();
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
