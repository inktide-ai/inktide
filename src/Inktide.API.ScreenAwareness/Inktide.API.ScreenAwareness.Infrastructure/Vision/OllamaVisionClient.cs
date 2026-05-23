using System.Net.Http.Json;
using System.Text.Json;
using Inktide.API.ScreenAwareness.Application.Interfaces;
using Inktide.API.ScreenAwareness.Application.Models;
using Inktide.API.ScreenAwareness.Application.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Inktide.API.ScreenAwareness.Infrastructure.Vision;

public sealed class OllamaVisionClient : IVisionModelClient
{

    private readonly HttpClient _http;
    private readonly ScreenAwarenessSettings _settings;
    private readonly IScreenEventExtractor _extractor;
    private readonly ILogger<OllamaVisionClient> _logger;

    private const string AnalysisPrompt =
        """
        Analyze this gaming stream screenshot. Identify key gameplay events happening right now.
        Respond ONLY with JSON in this exact format (no prose, no markdown):
        {"events":[{"event_type":"player_death","confidence":0.95,"metadata":{"enemy":"dragon"}},{"event_type":"boss_appeared","confidence":0.88,"metadata":{"boss":"fire_dragon"}}]}

        Known event types: player_death, boss_appeared, level_up, achievement_unlocked, game_started, game_over, item_pickup, combat_start, combat_end, cutscene, menu, generic.
        Only include events you can confidently identify. Return empty events array if nothing notable is happening.
        """;

    public string ProviderId => "ollama";

    public OllamaVisionClient(
        HttpClient http,
        IOptions<ScreenAwarenessSettings> settings,
        IScreenEventExtractor extractor,
        ILogger<OllamaVisionClient> logger)
    {
        _http      = http;
        _settings  = settings.Value;
        _extractor = extractor;
        _logger    = logger;
        _http.BaseAddress = new Uri(_settings.OllamaBaseUrl);
    }

    public async Task<ScreenAnalysis> AnalyzeAsync(string frameBase64, string contentType, CancellationToken ct = default)
    {
        var request = new
        {
            model  = _settings.OllamaVisionModel,
            prompt = AnalysisPrompt,
            images = new[] { frameBase64 },
            stream = false,
        };

        var response = await _http.PostAsJsonAsync("/api/generate", request, ct);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var doc    = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        var rawOutput = doc.RootElement.GetProperty("response").GetString() ?? string.Empty;
        return _extractor.Extract(rawOutput);
    }

}
