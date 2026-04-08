using System.Text.Json;

namespace Chimera.API.TTS.Infrastructure.ElevenLabs;

internal static class ElevenLabsErrorHandler
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

        var statusCode = (int)response.StatusCode;
        var reasonPhrase = response.ReasonPhrase;

        response.Dispose();

        var detail = TryExtractDetail(rawBody);
        if (detail is not null)
        {
            throw new HttpRequestException($"ElevenLabs returned {statusCode}: {detail}");
        }

        var body = string.IsNullOrWhiteSpace(rawBody)
            ? reasonPhrase ?? "Unknown error"
            : rawBody.Length <= 2_048 ? rawBody : string.Concat(rawBody.AsSpan(0, 2_048), "…");

        throw new HttpRequestException($"ElevenLabs returned {statusCode} ({response.StatusCode}). {body}");
    }

    private static string? TryExtractDetail(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            if (!root.TryGetProperty("detail", out var detail))
            {
                return null;
            }

            if (detail.ValueKind == JsonValueKind.String)
            {
                return detail.GetString();
            }

            if (detail.ValueKind == JsonValueKind.Object)
            {
                detail.TryGetProperty("status", out var statusEl);
                detail.TryGetProperty("message", out var msgEl);

                var status = statusEl.ValueKind == JsonValueKind.String ? statusEl.GetString() : null;
                var msg    = msgEl.ValueKind    == JsonValueKind.String ? msgEl.GetString()    : null;

                return status is not null ? $"[{status}] {msg}" : msg;
            }

            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
