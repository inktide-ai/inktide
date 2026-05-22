using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Models;
using Inktide.API.ScreenAwareness.Application.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.ScreenAwareness.Infrastructure.Vision;

public sealed class AnthropicVisionClient : IVisionModelClient
{

    private readonly HttpClient _http;
    private readonly ScreenAwarenessSettings _settings;
    private readonly IScreenEventExtractor _extractor;
    private readonly ILogger<AnthropicVisionClient> _logger;

    private const string AnthropicApiUrl = "https://api.anthropic.com/v1/messages";
    private const string AnthropicVersion = "2023-06-01";

    private const string AnalysisPrompt =
        """
        Analyze this gaming stream screenshot. Identify key gameplay events happening right now.
        Respond ONLY with JSON in this exact format (no prose, no markdown):
        {"events":[{"event_type":"player_death","confidence":0.95,"metadata":{"enemy":"dragon"}}]}

        Known event types: player_death, boss_appeared, level_up, achievement_unlocked, game_started, game_over, item_pickup, combat_start, combat_end, cutscene, menu, generic.
        Only include events you can confidently identify (confidence >= 0.5). Return empty events array if nothing notable.
        """;

    public string ProviderId => "anthropic";

    public AnthropicVisionClient(
        HttpClient http,
        IOptions<ScreenAwarenessSettings> settings,
        IScreenEventExtractor extractor,
        ILogger<AnthropicVisionClient> logger)
    {
        _http      = http;
        _settings  = settings.Value;
        _extractor = extractor;
        _logger    = logger;
    }

    public async Task<ScreenAnalysis> AnalyzeAsync(string frameBase64, string contentType, CancellationToken ct = default)
    {
        var request = new
        {
            model      = _settings.AnthropicModel,
            max_tokens = 256,
            messages   = new[]
            {
                new
                {
                    role    = "user",
                    content = new object[]
                    {
                        new { type = "image", source = new { type = "base64", media_type = contentType, data = frameBase64 } },
                        new { type = "text", text = AnalysisPrompt },
                    },
                },
            },
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl);
        req.Headers.Add("x-api-key", _settings.AnthropicApiKey);
        req.Headers.Add("anthropic-version", AnthropicVersion);
        req.Content = JsonContent.Create(request);

        var response = await _http.SendAsync(req, ct);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var doc    = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        var contentArr = doc.RootElement.GetProperty("content");
        if (contentArr.GetArrayLength() == 0)
        {
            _logger.LogWarning("[AnthropicVisionClient] Empty content array — content policy block");
            return _extractor.Extract(string.Empty);
        }

        var first = contentArr[0];
        if (!first.TryGetProperty("text", out var textProp))
        {
            _logger.LogWarning("[AnthropicVisionClient] No 'text' field in content[0] — unexpected response type");
            return _extractor.Extract(string.Empty);
        }

        var rawOutput = textProp.GetString() ?? string.Empty;
        return _extractor.Extract(rawOutput);
    }

}
